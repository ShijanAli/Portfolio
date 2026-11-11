import { z } from 'zod';
import { PAGINATION } from '@/config/constants';

/** The list query contract shared by every list endpoint and the admin DataTable. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(PAGINATION.maxLimit).default(PAGINATION.defaultLimit),
  sort: z.string().trim().max(50).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  search: z.string().trim().max(100).optional(),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;
