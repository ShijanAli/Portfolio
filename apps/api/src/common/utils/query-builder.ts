import { PAGINATION } from '@/config/constants';
import type { PaginationMeta } from './api-response';

export type SortOrder = 'asc' | 'desc';

export interface ListQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: SortOrder;
  search?: string;
  [filter: string]: unknown;
}

export interface QueryOptions {
  /** String columns matched (case-insensitive) by `?search=`. */
  searchFields?: string[];
  /** Columns that may be filtered by equality, e.g. `?status=PUBLISHED`. */
  filterFields?: string[];
  /** Whitelist for `?sort=`. Anything else falls back to defaultSort. */
  sortFields?: string[];
  defaultSort?: { field: string; order: SortOrder };
}

export interface ListArgs {
  where: Record<string, unknown>;
  orderBy: Record<string, SortOrder>;
  skip: number;
  take: number;
}

const FALLBACK_SORT = { field: 'createdAt', order: 'desc' } as const;

/** Translates the shared list query contract into Prisma findMany arguments. */
export function buildListArgs(query: ListQuery, options: QueryOptions = {}): ListArgs {
  const { searchFields = [], filterFields = [], sortFields = [] } = options;
  const defaultSort = options.defaultSort ?? FALLBACK_SORT;

  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(PAGINATION.maxLimit, Math.max(1, query.limit ?? PAGINATION.defaultLimit));

  const where: Record<string, unknown> = {};

  if (query.search && searchFields.length > 0) {
    where.OR = searchFields.map((field) => ({
      [field]: { contains: query.search, mode: 'insensitive' },
    }));
  }

  for (const field of filterFields) {
    if (query[field] !== undefined) where[field] = query[field];
  }

  const isAllowedSort = query.sort !== undefined && sortFields.includes(query.sort);
  const orderBy = isAllowedSort
    ? { [query.sort as string]: query.order ?? 'asc' }
    : { [defaultSort.field]: defaultSort.order };

  return { where, orderBy, skip: (page - 1) * limit, take: limit };
}

export function buildMeta(total: number, args: Pick<ListArgs, 'skip' | 'take'>): PaginationMeta {
  return {
    page: Math.floor(args.skip / args.take) + 1,
    limit: args.take,
    total,
    totalPages: Math.max(1, Math.ceil(total / args.take)),
  };
}
