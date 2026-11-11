import { z } from 'zod';
import {
  booleanQuerySchema,
  optionalAssetUrl,
  optionalText,
  optionalUrl,
  orderSchema,
  refineDateRange,
  toUpdateSchema,
} from '@/common/schemas/common.schema';
import { paginationSchema } from '@/common/schemas/pagination.schema';

const experienceFields = z.object({
  company: z.string().trim().min(2).max(120),
  position: z.string().trim().min(2).max(120),
  location: optionalText(120),
  employmentType: optionalText(40),
  companyUrl: optionalUrl,
  companyLogo: optionalAssetUrl,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  isCurrent: z.boolean().default(false),
  description: optionalText(5000),
  highlights: z.array(z.string().trim().min(1).max(300)).max(20).default([]),
  techStack: z.array(z.string().trim().min(1).max(40)).max(40).default([]),
  order: orderSchema.default(0),
  isActive: z.boolean().default(true),
});

export const createExperienceSchema = experienceFields.superRefine(refineDateRange);
export const updateExperienceSchema = toUpdateSchema(experienceFields).superRefine(refineDateRange);

export const experienceQuerySchema = paginationSchema.extend({
  isCurrent: booleanQuerySchema.optional(),
  isActive: booleanQuerySchema.optional(),
});

export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;
