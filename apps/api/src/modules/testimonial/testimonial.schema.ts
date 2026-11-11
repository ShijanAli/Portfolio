import { z } from 'zod';
import {
  booleanQuerySchema,
  optionalAssetUrl,
  optionalText,
  orderSchema,
  toUpdateSchema,
} from '@/common/schemas/common.schema';
import { paginationSchema } from '@/common/schemas/pagination.schema';

export const createTestimonialSchema = z.object({
  name: z.string().trim().min(2).max(100),
  role: optionalText(100),
  company: optionalText(100),
  avatar: optionalAssetUrl,
  message: z.string().trim().min(10).max(1000),
  rating: z.number().int().min(1).max(5).default(5),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  order: orderSchema.default(0),
});

export const updateTestimonialSchema = toUpdateSchema(createTestimonialSchema);

export const testimonialQuerySchema = paginationSchema.extend({
  isFeatured: booleanQuerySchema.optional(),
  isActive: booleanQuerySchema.optional(),
});

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;
