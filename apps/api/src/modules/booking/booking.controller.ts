import type { Booking } from '@prisma/client';
import type { Request, Response } from 'express';
import { createCrudController } from '@/common/base/base.controller';
import { isHoneypotFilled } from '@/common/schemas/common.schema';
import { created, ok } from '@/common/utils/api-response';
import type { CreateBookingInput, SlotQuery } from './booking.schema';
import { bookingService } from './booking.service';

const tokenOf = (req: Request) => String(req.params.token);

/** What a visitor may see of a booking: no internal notes, ids or tokens of other records. */
const toPublicBooking = (booking: Booking) => ({
  code: booking.code,
  name: booking.name,
  startAt: booking.startAt,
  endAt: booking.endAt,
  clientTimezone: booking.clientTimezone,
  status: booking.status,
  meetLink: booking.meetLink,
  manageToken: booking.manageToken,
});

export const bookingController = {
  ...createCrudController(bookingService),

  slots: async (req: Request, res: Response) => {
    const { timezone, slotDuration, slots } = await bookingService.getSlots(
      req.query as unknown as SlotQuery,
    );
    ok(res, { timezone, slotDuration, slots });
  },

  book: async (req: Request, res: Response) => {
    const body = req.body as CreateBookingInput;
    if (isHoneypotFilled(body)) {
      created(res, null);
      return;
    }
    created(res, toPublicBooking(await bookingService.book(body)));
  },

  getByToken: async (req: Request, res: Response) => {
    ok(res, toPublicBooking(await bookingService.getByToken(tokenOf(req))));
  },

  cancelByToken: async (req: Request, res: Response) => {
    const booking = await bookingService.cancelByToken(tokenOf(req), req.body.reason);
    ok(res, toPublicBooking(booking));
  },

  rescheduleByToken: async (req: Request, res: Response) => {
    const booking = await bookingService.rescheduleByToken(tokenOf(req), req.body.startAt);
    ok(res, toPublicBooking(booking));
  },

  updateStatus: async (req: Request, res: Response) => {
    ok(res, await bookingService.updateStatus(String(req.params.id), req.body));
  },

  getSettings: async (_req: Request, res: Response) => {
    ok(res, await bookingService.getSettings());
  },

  updateSettings: async (req: Request, res: Response) => {
    ok(res, await bookingService.updateSettings(req.body));
  },
};
