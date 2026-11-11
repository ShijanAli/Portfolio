import { randomInt } from 'node:crypto';
import type { Booking, BookingSetting, BookingStatus } from '@prisma/client';
import { DateTime } from 'luxon';
import { BaseService, type Where } from '@/common/base/base.service';
import { ApiError } from '@/common/utils/api-error';
import type { ListQuery } from '@/common/utils/query-builder';
import { generateToken } from '@/common/utils/token';
import {
  bookingAdminNoticeEmail,
  bookingCancelledEmail,
  bookingConfirmedEmail,
  bookingReceivedEmail,
  bookingRescheduledEmail,
} from '@/emails/booking.emails';
import { sendEmailInBackground, type EmailMessage } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';
import type {
  CreateBookingInput,
  SlotQuery,
  UpdateBookingSettingInput,
  UpdateBookingStatusInput,
} from './booking.schema';
import { generateSlots } from './booking.slots';

const ACTIVE: BookingStatus[] = ['PENDING', 'CONFIRMED'];
const SETTING_ID = 'default';
const OVERLAP_CONSTRAINT = 'Booking_no_overlap';
const SLOT_TAKEN = 'This time is no longer available. Please choose another slot.';
const DAY_MS = 24 * 60 * 60 * 1000;

/** What an admin may do from each status. Finished bookings cannot be reopened. */
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

/** Readable reference without look-alike characters (no 0/O, 1/I). */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateCode = () =>
  `BK-${Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('')}`;

const notify = (email: EmailMessage | null) => {
  if (email) sendEmailInBackground(email);
};

class BookingService extends BaseService<Booking, never, never> {
  constructor() {
    super(prisma.booking, {
      resource: 'Booking',
      include: { service: { select: { id: true, title: true, slug: true } } },
      searchFields: ['name', 'email', 'code', 'company'],
      filterFields: ['status'],
      sortFields: ['startAt', 'name', 'createdAt'],
      defaultSort: { field: 'startAt', order: 'desc' },
    });
  }

  protected override extraWhere(query: ListQuery): Where {
    const range: Where = {};
    if (query.from instanceof Date) range.gte = query.from;
    if (query.to instanceof Date) range.lt = query.to;
    return Object.keys(range).length > 0 ? { startAt: range } : {};
  }

  // ----- Settings -----

  getSettings(): Promise<BookingSetting> {
    return prisma.bookingSetting.upsert({ where: { id: SETTING_ID }, update: {}, create: {} });
  }

  async updateSettings(input: UpdateBookingSettingInput): Promise<BookingSetting> {
    await this.getSettings();
    return prisma.bookingSetting.update({ where: { id: SETTING_ID }, data: input });
  }

  // ----- Slots -----

  /** `ignoreBookingId` frees a booking's own slot while it is being rescheduled. */
  async getSlots({ from, to }: SlotQuery, ignoreBookingId?: string) {
    const settings = await this.getSettings();
    const zone = settings.timezone;
    const rangeStart = DateTime.fromISO(from, { zone }).startOf('day').toJSDate();
    const rangeEnd = DateTime.fromISO(to, { zone }).endOf('day').toJSDate();

    const [weekly, exceptions, bookings] = await Promise.all([
      prisma.availability.findMany({ where: { isActive: true } }),
      prisma.availabilityException.findMany({
        where: { date: { gte: new Date(`${from}T00:00:00Z`), lte: new Date(`${to}T00:00:00Z`) } },
      }),
      prisma.booking.findMany({
        where: {
          status: { in: ACTIVE },
          id: ignoreBookingId ? { not: ignoreBookingId } : undefined,
          // A day either side, so buffers across midnight are respected.
          startAt: {
            gte: new Date(rangeStart.getTime() - DAY_MS),
            lte: new Date(rangeEnd.getTime() + DAY_MS),
          },
        },
        select: { startAt: true, endAt: true },
      }),
    ]);

    const slots = generateSlots(
      { settings, weekly, exceptions, bookings, now: new Date() },
      from,
      to,
    );
    return { timezone: zone, slotDuration: settings.slotDuration, slots, settings };
  }

  /** Resolves the end time and initial status for a start time, or throws if it is not bookable. */
  private async reserve(startAt: Date, ignoreBookingId?: string) {
    const settings = await this.getSettings();
    const date = DateTime.fromJSDate(startAt, { zone: settings.timezone }).toISODate();
    if (!date) throw ApiError.conflict(SLOT_TAKEN);

    const { slots } = await this.getSlots({ from: date, to: date }, ignoreBookingId);
    if (!slots.some((slot) => slot.getTime() === startAt.getTime())) {
      throw ApiError.conflict(SLOT_TAKEN);
    }

    const status: BookingStatus = settings.autoConfirm ? 'CONFIRMED' : 'PENDING';
    const endAt = new Date(startAt.getTime() + settings.slotDuration * 60_000);
    return { settings, endAt, status };
  }

  /**
   * The availability check above can pass for two simultaneous requests. The database
   * exclusion constraint is what guarantees only one of them is stored.
   */
  private async guardOverlap<T>(write: () => Promise<T>): Promise<T> {
    try {
      return await write();
    } catch (error) {
      if (error instanceof Error && error.message.includes(OVERLAP_CONSTRAINT)) {
        throw ApiError.conflict(SLOT_TAKEN);
      }
      throw error;
    }
  }

  // ----- Visitor actions -----

  async book({ website: _website, ...input }: CreateBookingInput): Promise<Booking> {
    const { settings, endAt, status } = await this.reserve(input.startAt);

    const booking = await this.guardOverlap(() =>
      prisma.booking.create({
        data: { ...input, endAt, status, code: generateCode(), manageToken: generateToken(32) },
      }),
    );

    notify(status === 'CONFIRMED' ? bookingConfirmedEmail(booking) : bookingReceivedEmail(booking));
    notify(bookingAdminNoticeEmail(booking, 'New booking', settings.timezone));
    return booking;
  }

  async getByToken(manageToken: string): Promise<Booking> {
    return this.findOneOrThrow({ manageToken });
  }

  async cancelByToken(manageToken: string, reason?: string | null): Promise<Booking> {
    const booking = await this.getActiveByToken(manageToken);
    const cancelled = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED', cancelReason: reason },
    });

    notify(bookingCancelledEmail(cancelled));
    const { timezone } = await this.getSettings();
    notify(bookingAdminNoticeEmail(cancelled, 'Booking cancelled by client', timezone));
    return cancelled;
  }

  async rescheduleByToken(manageToken: string, startAt: Date): Promise<Booking> {
    const booking = await this.getActiveByToken(manageToken);
    const { settings, endAt, status } = await this.reserve(startAt, booking.id);

    const moved = await this.guardOverlap(() =>
      prisma.booking.update({
        where: { id: booking.id },
        data: { startAt, endAt, status, reminderSentAt: null },
      }),
    );

    notify(bookingRescheduledEmail(moved));
    notify(bookingAdminNoticeEmail(moved, 'Booking rescheduled by client', settings.timezone));
    return moved;
  }

  private async getActiveByToken(manageToken: string): Promise<Booking> {
    const booking = await this.getByToken(manageToken);
    if (!ACTIVE.includes(booking.status) || booking.startAt <= new Date()) {
      throw ApiError.conflict('This booking can no longer be changed');
    }
    return booking;
  }

  // ----- Admin actions -----

  async updateStatus(
    id: string,
    { status, ...details }: UpdateBookingStatusInput,
  ): Promise<Booking> {
    const booking = await this.getById(id);
    if (!TRANSITIONS[booking.status].includes(status)) {
      throw ApiError.conflict(`A ${booking.status} booking cannot be changed to ${status}`);
    }

    const updated = await prisma.booking.update({ where: { id }, data: { status, ...details } });

    if (status === 'CONFIRMED') notify(bookingConfirmedEmail(updated));
    if (status === 'CANCELLED') notify(bookingCancelledEmail(updated));
    return updated;
  }
}

export const bookingService = new BookingService();
