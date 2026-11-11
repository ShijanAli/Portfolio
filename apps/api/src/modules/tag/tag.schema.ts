import type { z } from 'zod';
import { toUpdateSchema } from '@/common/schemas/common.schema';
import { paginationSchema } from '@/common/schemas/pagination.schema';
import { taxonomyFields } from '@/common/schemas/taxonomy.schema';

export const createTagSchema = taxonomyFields;

export const updateTagSchema = toUpdateSchema(createTagSchema);

export const tagQuerySchema = paginationSchema;

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
