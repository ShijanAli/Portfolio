import { z } from 'zod';
import { booleanQuerySchema, toUpdateSchema } from '@/common/schemas/common.schema';
import { paginationSchema } from '@/common/schemas/pagination.schema';
import { refineTimeRange, timeOfDaySchema } from '@/common/schemas/time.schema';

const availabilityFields = z.object({
  /** 0 = Sunday ... 6 = Saturday. */
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: timeOfDaySchema,
  endTime: timeOfDaySchema,
  isActive: z.boolean().default(true),
});

export const createAvailabilitySchema = availabilityFields.superRefine(refineTimeRange);
export const updateAvailabilitySchema =
  toUpdateSchema(availabilityFields).superRefine(refineTimeRange);

export const availabilityQuerySchema = paginationSchema.extend({
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
  isActive: booleanQuerySchema.optional(),
});

export type CreateAvailabilityInput = z.infer<typeof createAvailabilitySchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
