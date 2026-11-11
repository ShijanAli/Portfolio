import { z } from 'zod';
import {
  booleanQuerySchema,
  optionalText,
  orderSchema,
  refineDateRange,
  toUpdateSchema,
} from '@/common/schemas/common.schema';
import { paginationSchema } from '@/common/schemas/pagination.schema';

const educationFields = z.object({
  institute: z.string().trim().min(2).max(160),
  degree: z.string().trim().min(2).max(160),
  fieldOfStudy: optionalText(160),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  isCurrent: z.boolean().default(false),
  grade: optionalText(40),
  description: optionalText(3000),
  order: orderSchema.default(0),
  isActive: z.boolean().default(true),
});

export const createEducationSchema = educationFields.superRefine(refineDateRange);
export const updateEducationSchema = toUpdateSchema(educationFields).superRefine(refineDateRange);

export const educationQuerySchema = paginationSchema.extend({
  isActive: booleanQuerySchema.optional(),
});

export type CreateEducationInput = z.infer<typeof createEducationSchema>;
export type UpdateEducationInput = z.infer<typeof updateEducationSchema>;
