import type { z } from 'zod';
import { orderSchema, toUpdateSchema } from '@/common/schemas/common.schema';
import { paginationSchema } from '@/common/schemas/pagination.schema';
import { taxonomyFields } from '@/common/schemas/taxonomy.schema';

export const createProjectCategorySchema = taxonomyFields.extend({
  order: orderSchema.default(0),
});

export const updateProjectCategorySchema = toUpdateSchema(createProjectCategorySchema);

export const projectCategoryQuerySchema = paginationSchema;

export type CreateProjectCategoryInput = z.infer<typeof createProjectCategorySchema>;
export type UpdateProjectCategoryInput = z.infer<typeof updateProjectCategorySchema>;
