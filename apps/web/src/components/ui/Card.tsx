import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

/**
 * The base surface of every card on the site. `interactive` adds the pointer-following
 * highlight (it reads the --pointer-x / --pointer-y variables that <Tilt> sets).
 */
export function Card({
  className,
  interactive,
  ...props
}: ComponentProps<'div'> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-border bg-surface',
        interactive &&
          'before:pointer-events-none before:absolute before:inset-0 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100 before:bg-[radial-gradient(420px_circle_at_var(--pointer-x,50%)_var(--pointer-y,50%),color-mix(in_oklab,var(--color-accent)_18%,transparent),transparent_70%)]',
        className,
      )}
      {...props}
    />
  );
}

export function Tag({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-border bg-raised px-3 py-1 text-xs text-muted',
        className,
      )}
      {...props}
    />
  );
}
