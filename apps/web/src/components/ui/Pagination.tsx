import type { PaginationMeta } from '@portfolio/api-client';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ButtonLink } from './Button';

interface PaginationProps {
  meta: PaginationMeta;
  /** Builds the link to a page number, keeping any active filters. */
  hrefFor: (page: number) => string;
}

export function Pagination({ meta, hrefFor }: PaginationProps) {
  if (meta.totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-4">
      {meta.page > 1 && (
        <ButtonLink href={hrefFor(meta.page - 1)} variant="secondary" rel="prev">
          <ArrowLeft className="size-4" aria-hidden />
          Newer
        </ButtonLink>
      )}
      <p className="text-sm text-muted">
        Page {meta.page} of {meta.totalPages}
      </p>
      {meta.page < meta.totalPages && (
        <ButtonLink href={hrefFor(meta.page + 1)} variant="secondary" rel="next">
          Older
          <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
      )}
    </nav>
  );
}
