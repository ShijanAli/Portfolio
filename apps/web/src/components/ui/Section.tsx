import type { ReactNode } from 'react';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { cn } from '@/lib/cn';

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-7xl px-6', className)}>{children}</div>;
}

interface SectionProps {
  /** Anchor id, used by the navigation. */
  id: string;
  children: ReactNode;
  className?: string;
}

export function Section({ id, children, className }: SectionProps) {
  return (
    <section id={id} className={cn('relative py-24 md:py-36', className)}>
      {children}
    </section>
  );
}

interface SectionHeadingProps {
  /** Small label above the title, e.g. "Services". */
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  action?: ReactNode;
}

/** The heading block every section opens with. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  action,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'mb-12 flex flex-wrap items-end justify-between gap-6 md:mb-16',
        align === 'center' && 'flex-col items-center text-center',
      )}
    >
      <div className={cn('max-w-3xl', align === 'center' && 'mx-auto')}>
        <p
          data-reveal
          className="mb-4 flex items-center gap-3 font-mono text-xs tracking-[0.2em] text-accent-text uppercase"
        >
          <span className="h-px w-8 bg-accent" aria-hidden />
          {eyebrow}
        </p>
        <SplitHeading
          text={title}
          className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-6xl"
        />
        {description && (
          <p data-reveal className="mt-5 text-lg text-pretty text-muted">
            {description}
          </p>
        )}
      </div>
      {action && <div data-reveal>{action}</div>}
    </div>
  );
}
