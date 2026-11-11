import type { ListQuery } from '@portfolio/api-client';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { SortState } from '@/components/data-table/types';

const DEFAULT_LIMIT = 10;

/**
 * Table state (page, page size, sort, search, filters) lives in the URL, so a view can be
 * bookmarked, shared, and survives a refresh or the browser's back button.
 */
export function useTableState(filterNames: string[]) {
  const [params, setParams] = useSearchParams();

  /** Sets or removes query parameters. Anything but a page change goes back to page 1. */
  const patch = useCallback(
    (changes: Record<string, string | number | undefined>, keepPage = false) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (!keepPage) next.delete('page');
          for (const [key, value] of Object.entries(changes)) {
            if (value === undefined || value === '') next.delete(key);
            else next.set(key, String(value));
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const search = params.get('search') ?? '';
  const sort: SortState = useMemo(
    () => ({
      sort: params.get('sort') ?? undefined,
      order: (params.get('order') as SortState['order']) ?? undefined,
    }),
    [params],
  );
  const filters = useMemo(
    () => Object.fromEntries(filterNames.map((name) => [name, params.get(name) ?? ''])),
    // The names come from a static config; joining keeps the dependency stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params, filterNames.join(',')],
  );

  const query: ListQuery = useMemo(
    () => ({
      page: Number(params.get('page')) || 1,
      limit: Number(params.get('limit')) || DEFAULT_LIMIT,
      search: search || undefined,
      ...sort,
      ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
    }),
    [params, search, sort, filters],
  );

  return {
    query,
    search,
    sort,
    filters,
    setSearch: (value: string) => patch({ search: value }),
    setSort: (next: SortState) => patch({ sort: next.sort, order: next.order }),
    setFilter: (name: string, value: string) => patch({ [name]: value }),
    setPage: (page: number) => patch({ page: page > 1 ? page : undefined }, true),
    setLimit: (limit: number) => patch({ limit: limit === DEFAULT_LIMIT ? undefined : limit }),
  };
}
