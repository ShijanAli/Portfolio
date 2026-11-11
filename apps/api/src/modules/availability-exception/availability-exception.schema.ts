import { z } from 'zod';
import { optionalText, toUpdateSchema } from '@/common/schemas/common.schema';
import { paginationSchema } from '@/common/schemas/pagination.schema';
import { dateOnlySchema, refineTimeRange, timeOfDaySchema } from '@/common/schemas/time.schema';

const exceptionFields = z.object({
  date: dateOnlySchema.transform((value) => new Date(`${value}T00:00:00Z`)),
  /** `true` blocks the whole day. `false` replaces the weekly hours with the times below. */
  isOff: z.boolean().default(true),
  startTime: timeOfDaySchema.nullable().optional(),
  endTime: timeOfDaySchema.nullable().optional(),
  note: optionalText(200),
});

function refineCustomHours(
  data: { isOff?: boolean; startTime?: string | null; endTime?: string | null },
  ctx: z.RefinementCtx,
) {
  refineTimeRange(data, ctx);
  if (data.isOff === false && (!data.startTime || !data.endTime)) {
    ctx.addIssue({
      code: 'custom',
      path: ['startTime'],
      message: 'Custom hours need a start and an end time',
    });
  }
}

export const createAvailabilityExceptionSchema = exceptionFields.superRefine(refineCustomHours);
export const updateAvailabilityExceptionSchema =
  toUpdateSchema(exceptionFields).superRefine(refineCustomHours);

export const availabilityExceptionQuerySchema = paginationSchema;

export type CreateAvailabilityExceptionInput = z.infer<typeof createAvailabilityExceptionSchema>;
export type UpdateAvailabilityExceptionInput = z.infer<typeof updateAvailabilityExceptionSchema>;
