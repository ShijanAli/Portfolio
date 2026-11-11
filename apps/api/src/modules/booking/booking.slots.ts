import { DateTime } from 'luxon';

/**
 * Pure slot calculation: no database, no clock. Everything it needs is passed in, which
 * keeps the rules easy to test.
 */

export interface SlotSettings {
  timezone: string;
  slotDuration: number;
  bufferTime: number;
  minNoticeHours: number;
  maxDaysAhead: number;
  maxPerDay: number;
}

export interface TimeWindow {
  startTime: string;
  endTime: string;
}

export interface WeeklyWindow extends TimeWindow {
  dayOfWeek: number;
  isActive: boolean;
}

export interface DayException {
  /** Stored as a date-only value (UTC midnight). */
  date: Date;
  isOff: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface BusyRange {
  startAt: Date;
  endAt: Date;
}

export interface SlotContext {
  settings: SlotSettings;
  weekly: WeeklyWindow[];
  exceptions: DayException[];
  /** Active (pending or confirmed) bookings. */
  bookings: BusyRange[];
  now: Date;
}

const MINUTE = 60_000;

const dateKeyOf = (date: Date, zone: string) => DateTime.fromJSDate(date, { zone }).toISODate();

function windowsFor(day: DateTime, { weekly, exceptions }: SlotContext): TimeWindow[] {
  const exception = exceptions.find(
    (item) => item.date.toISOString().slice(0, 10) === day.toISODate(),
  );

  if (exception?.isOff) return [];
  if (exception?.startTime && exception.endTime) {
    return [{ startTime: exception.startTime, endTime: exception.endTime }];
  }

  // Luxon: Monday = 1 ... Sunday = 7. Stored: Sunday = 0 ... Saturday = 6.
  const dayOfWeek = day.weekday % 7;
  return weekly.filter((window) => window.isActive && window.dayOfWeek === dayOfWeek);
}

/**
 * Bookable slot start times between two calendar dates (inclusive, in the owner's
 * timezone), returned as UTC instants in ascending order.
 */
export function generateSlots(context: SlotContext, from: string, to: string): Date[] {
  const { settings, bookings, now } = context;
  const zone = settings.timezone;
  const duration = settings.slotDuration * MINUTE;
  const buffer = settings.bufferTime * MINUTE;

  const earliest = now.getTime() + settings.minNoticeHours * 60 * MINUTE;
  const latest = now.getTime() + settings.maxDaysAhead * 24 * 60 * MINUTE;

  const isFree = (start: number) =>
    bookings.every(
      (booking) =>
        start >= booking.endAt.getTime() + buffer ||
        start + duration + buffer <= booking.startAt.getTime(),
    );

  const slots: Date[] = [];
  const lastDay = DateTime.fromISO(to, { zone });

  for (let day = DateTime.fromISO(from, { zone }); day <= lastDay; day = day.plus({ days: 1 })) {
    const dateKey = day.toISODate();
    const bookedThatDay = bookings.filter(
      (item) => dateKeyOf(item.startAt, zone) === dateKey,
    ).length;
    if (bookedThatDay >= settings.maxPerDay) continue;

    for (const window of windowsFor(day, context)) {
      const windowEnd = DateTime.fromISO(`${dateKey}T${window.endTime}`, { zone }).toMillis();
      let start = DateTime.fromISO(`${dateKey}T${window.startTime}`, { zone }).toMillis();

      for (; start + duration <= windowEnd; start += duration + buffer) {
        if (start >= earliest && start <= latest && isFree(start)) slots.push(new Date(start));
      }
    }
  }

  return slots.sort((a, b) => a.getTime() - b.getTime());
}
