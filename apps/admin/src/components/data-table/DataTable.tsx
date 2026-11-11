import type { PaginationMeta } from '@portfolio/api-client';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { cn } from '@/lib/cn';
import { DataTablePagination } from './DataTablePagination';
import { RowActions } from './RowActions';
import type { Column, Row, RowAction, SortState } from './types';

interface DataTableProps<T extends Row> {
  columns: Column<T>[];
  rows: T[] | undefined;
  meta: PaginationMeta | undefined;
  isLoading: boolean;
  error?: unknown;
  onRetry?: () => void;
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  rowActions?: RowAction<T>[];
  /** Enables row checkboxes. */
  selection?: { selected: Set<string>; onChange: (selected: Set<string>) => void };
  emptyState?: ReactNode;
}

const SKELETON_ROWS = 6;
const cellPadding = 'px-4 py-3';

/** asc -> desc -> unsorted */
function nextSort(current: SortState, key: string): SortState {
  if (current.sort !== key) return { sort: key, order: 'asc' };
  return current.order === 'asc' ? { sort: key, order: 'desc' } : {};
}

function SortIcon({ active, order }: { active: boolean; order?: 'asc' | 'desc' }) {
  if (!active) return <ChevronsUpDown className="size-3.5 opacity-40" />;
  return order === 'asc' ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />;
}

/**
 * The one table of the admin: server-side pagination and sorting, optional row selection
 * and row actions, plus loading, empty and error states. It only renders; the page that
 * uses it owns the data and the query state.
 */
export function DataTable<T extends Row>({
  columns,
  rows,
  meta,
  isLoading,
  error,
  onRetry,
  sort,
  onSortChange,
  onPageChange,
  onLimitChange,
  rowActions,
  selection,
  emptyState,
}: DataTableProps<T>) {
  const allSelected =
    Boolean(rows?.length) && rows!.every((row) => selection?.selected.has(row.id));
  const columnCount = columns.length + (selection ? 1 : 0) + (rowActions ? 1 : 0);

  const toggleAll = () => {
    if (!selection || !rows) return;
    selection.onChange(allSelected ? new Set() : new Set(rows.map((row) => row.id)));
  };

  const toggleRow = (id: string) => {
    if (!selection) return;
    const next = new Set(selection.selected);
    if (!next.delete(id)) next.add(id);
    selection.onChange(next);
  };

  const renderBody = () => {
    if (error) {
      return (
        <tr>
          <td colSpan={columnCount}>
            <ErrorState error={error} onRetry={onRetry} />
          </td>
        </tr>
      );
    }

    if (isLoading || !rows) {
      return Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <tr key={index} className="border-t border-border">
          {Array.from({ length: columnCount }, (_cell, cell) => (
            <td key={cell} className={cellPadding}>
              <Skeleton className="h-4 w-full max-w-40" />
            </td>
          ))}
        </tr>
      ));
    }

    if (rows.length === 0) {
      return (
        <tr>
          <td colSpan={columnCount}>{emptyState ?? <EmptyState title="Nothing here yet" />}</td>
        </tr>
      );
    }

    return rows.map((row) => (
      <tr key={row.id} className="border-t border-border transition-colors hover:bg-raised/40">
        {selection && (
          <td className={cn(cellPadding, 'w-10')}>
            <input
              type="checkbox"
              aria-label="Select row"
              className="size-4 cursor-pointer accent-accent"
              checked={selection.selected.has(row.id)}
              onChange={() => toggleRow(row.id)}
            />
          </td>
        )}
        {columns.map((column) => (
          <td key={column.key} className={cn(cellPadding, column.className)}>
            {column.cell
              ? column.cell(row)
              : String((row as Record<string, unknown>)[column.key] ?? '—')}
          </td>
        ))}
        {rowActions && (
          <td className={cn(cellPadding, 'w-12 text-right')}>
            <RowActions row={row} actions={rowActions} />
          </td>
        )}
      </tr>
    ));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-raised/50 text-xs tracking-wide text-muted uppercase">
            <tr>
              {selection && (
                <th className={cn(cellPadding, 'w-10')}>
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    className="size-4 cursor-pointer accent-accent"
                    checked={allSelected}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(cellPadding, 'font-medium whitespace-nowrap', column.className)}
                  aria-sort={
                    sort.sort === column.key
                      ? sort.order === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSortChange(nextSort(sort, column.key))}
                      className="inline-flex cursor-pointer items-center gap-1 uppercase hover:text-fg"
                    >
                      {column.header}
                      <SortIcon active={sort.sort === column.key} order={sort.order} />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {rowActions && <th className={cn(cellPadding, 'w-12')} aria-label="Actions" />}
            </tr>
          </thead>
          <tbody>{renderBody()}</tbody>
        </table>
      </div>
      {meta && !error && (
        <DataTablePagination
          meta={meta}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      )}
    </div>
  );
}
