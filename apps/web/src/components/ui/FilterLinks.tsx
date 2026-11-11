import Link from 'next/link';
import { cn } from '@/lib/cn';

interface FilterLinksProps {
  /** Page the filters belong to, e.g. "/blog". */
  basePath: string;
  /** Query parameter name, e.g. "category". */
  param: string;
  options: { label: string; value: string }[];
  active?: string;
  label: string;
}

/** A row of filter chips that are real links, so every filtered view has its own URL. */
export function FilterLinks({ basePath, param, options, active, label }: FilterLinksProps) {
  if (options.length === 0) return null;

  const chip = (isActive: boolean) =>
    cn(
      'rounded-full border px-4 py-2 text-sm transition-colors',
      isActive
        ? 'border-accent bg-accent/15 text-fg'
        : 'border-border text-muted hover:border-muted/60 hover:text-fg',
    );

  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            href={basePath}
            className={chip(!active)}
            aria-current={!active ? 'page' : undefined}
          >
            All
          </Link>
        </li>
        {options.map((option) => (
          <li key={option.value}>
            <Link
              href={`${basePath}?${param}=${encodeURIComponent(option.value)}`}
              className={chip(active === option.value)}
              aria-current={active === option.value ? 'page' : undefined}
            >
              {option.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
