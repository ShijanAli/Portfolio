import { z } from 'zod';
import {
  emailSchema,
  honeypotSchema,
  idSchema,
  optionalAssetUrl,
  optionalText,
} from '@/common/schemas/common.schema';
import { paginationSchema } from '@/common/schemas/pagination.schema';
import { dateOnlySchema, timezoneSchema } from '@/common/schemas/time.schema';

export const bookingStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]);

const MAX_SLOT_RANGE_DAYS = 45;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Calendar dates in the owner's timezone, both inclusive. */
export const slotQuerySchema = z
  .object({ from: dateOnlySchema, to: dateOnlySchema })
  .refine((range) => range.to >= range.from, { path: ['to'], message: 'Must not be before "from"' })
  .refine(
    (range) => Date.parse(range.to) - Date.parse(range.from) <= MAX_SLOT_RANGE_DAYS * DAY_MS,
    { path: ['to'], message: `Range can be at most ${MAX_SLOT_RANGE_DAYS} days` },
  );

export const createBookingSchema = z.object({
  serviceId: idSchema.optional(),
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  email: emailSchema,
  phone: optionalText(30),
  company: optionalText(100),
  message: optionalText(2000),
  /** One of the instants returned by the slots endpoint. */
  startAt: z.coerce.date(),
  clientTimezone: timezoneSchema,
  website: honeypotSchema,
});

export const updateBookingStatusSchema = z.object({
  status: bookingStatusSchema.exclude(['PENDING']),
  meetLink: optionalAssetUrl,
  adminNote: optionalText(1000),
  cancelReason: optionalText(500),
});

export const manageTokenParamSchema = z.object({ token: z.string().min(20).max(128) });

export const cancelBookingSchema = z.object({ reason: optionalText(500) });

export const rescheduleBookingSchema = z.object({ startAt: z.coerce.date() });

export const bookingQuerySchema = paginationSchema.extend({
  status: bookingStatusSchema.optional(),
  /** Bookings starting on or after / before this instant. */
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const updateBookingSettingSchema = z
  .object({
    timezone: timezoneSchema,
    slotDuration: z.number().int().min(10).max(240),
    bufferTime: z.number().int().min(0).max(120),
    minNoticeHours: z.number().int().min(0).max(720),
    maxDaysAhead: z.number().int().min(1).max(365),
    maxPerDay: z.number().int().min(1).max(50),
    autoConfirm: z.boolean(),
  })
  .partial();

export type SlotQuery = z.infer<typeof slotQuerySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type UpdateBookingSettingInput = z.infer<typeof updateBookingSettingSchema>;
