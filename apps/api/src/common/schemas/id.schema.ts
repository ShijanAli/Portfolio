import { z } from 'zod';
import { idSchema } from './common.schema';

export const idParamSchema = z.object({ id: idSchema });

export const slugParamSchema = z.object({ slug: z.string().trim().min(1).max(160) });

export const bulkIdsSchema = z.object({
  ids: z.array(idSchema).min(1).max(100),
});

export type BulkIdsInput = z.infer<typeof bulkIdsSchema>;
