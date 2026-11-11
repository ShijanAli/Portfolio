import type { PaginationMeta } from '@portfolio/api-client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/inputs';

const PAGE_SIZES = [10, 20, 50, 100].map((size) => ({
  value: String(size),
  label: `${size} / page`,
}));

interface DataTablePaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function DataTablePagination({
  meta,
  onPageChange,
  onLimitChange,
}: DataTablePaginationProps) {
  const first = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const last = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
      <p className="text-muted">
        {first}–{last} of {meta.total}
      </p>
      <div className="flex items-center gap-2">
        <Select
          aria-label="Rows per page"
          className="h-8 w-auto text-xs"
          options={PAGE_SIZES}
          value={String(meta.limit)}
          onChange={(event) => onLimitChange(Number(event.target.value))}
        />
        <Button
          variant="secondary"
          size="icon"
          aria-label="Previous page"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-16 text-center text-muted">
          {meta.page} / {meta.totalPages}
        </span>
        <Button
          variant="secondary"
          size="icon"
          aria-label="Next page"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
