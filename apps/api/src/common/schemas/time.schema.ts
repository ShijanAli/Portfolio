import { IANAZone } from 'luxon';
import { z } from 'zod';

/** "HH:mm", 24-hour. Compares correctly as a plain string. */
export const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour time like 09:30');

/** "YYYY-MM-DD" calendar date, without a time or zone. */
export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date like 2026-03-15')
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), 'Invalid date');

export const timezoneSchema = z
  .string()
  .max(64)
  .refine((zone) => IANAZone.isValidZone(zone), 'Unknown timezone');

export function refineTimeRange(
  data: { startTime?: string | null; endTime?: string | null },
  ctx: z.RefinementCtx,
) {
  if (data.startTime && data.endTime && data.endTime <= data.startTime) {
    ctx.addIssue({
      code: 'custom',
      path: ['endTime'],
      message: 'End time must be after start time',
    });
  }
}
