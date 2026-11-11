import type { z } from 'zod';
import { optionalText, orderSchema, toUpdateSchema } from '@/common/schemas/common.schema';
import { paginationSchema } from '@/common/schemas/pagination.schema';
import { taxonomyFields } from '@/common/schemas/taxonomy.schema';

export const createBlogCategorySchema = taxonomyFields.extend({
  description: optionalText(300),
  order: orderSchema.default(0),
});

export const updateBlogCategorySchema = toUpdateSchema(createBlogCategorySchema);

export const blogCategoryQuerySchema = paginationSchema;

export type CreateBlogCategoryInput = z.infer<typeof createBlogCategorySchema>;
export type UpdateBlogCategoryInput = z.infer<typeof updateBlogCategorySchema>;
