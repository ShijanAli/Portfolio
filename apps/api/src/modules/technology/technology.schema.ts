import { z } from 'zod';
import {
  booleanQuerySchema,
  optionalAssetUrl,
  orderSchema,
  slugSchema,
  toUpdateSchema,
} from '@/common/schemas/common.schema';
import { paginationSchema } from '@/common/schemas/pagination.schema';

export const technologyCategorySchema = z.enum([
  'FRONTEND',
  'BACKEND',
  'DATABASE',
  'DEVOPS',
  'MOBILE',
  'TOOL',
  'OTHER',
]);

export const createTechnologySchema = z.object({
  name: z.string().trim().min(1).max(60),
  /** Generated from the name when omitted. */
  slug: slugSchema.optional(),
  icon: optionalAssetUrl,
  category: technologyCategorySchema.default('OTHER'),
  proficiency: z.number().int().min(0).max(100).nullable().optional(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  order: orderSchema.default(0),
});

export const updateTechnologySchema = toUpdateSchema(createTechnologySchema);

export const technologyQuerySchema = paginationSchema.extend({
  category: technologyCategorySchema.optional(),
  isFeatured: booleanQuerySchema.optional(),
  isActive: booleanQuerySchema.optional(),
});

export type CreateTechnologyInput = z.infer<typeof createTechnologySchema>;
export type UpdateTechnologyInput = z.infer<typeof updateTechnologySchema>;
