import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { cn } from '@/lib/cn';
import { Container } from './Section';

interface Crumb {
  label: string;
  href: string;
}

interface PageHeaderProps {
  title: string;
  description?: string | null;
  eyebrow?: string;
  /** Parent pages, e.g. Blog for an article. The current page is added automatically. */
  breadcrumbs?: Crumb[];
  /** Extra content under the description, e.g. tags or meta information. */
  children?: ReactNode;
  /** Slightly smaller title, for long headlines such as article titles. */
  compact?: boolean;
}

/** The top of every inner page: breadcrumb, title and intro, cleared of the fixed header. */
export function PageHeader({
  title,
  description,
  eyebrow,
  breadcrumbs = [],
  children,
  compact,
}: PageHeaderProps) {
  return (
    <header className="relative overflow-hidden pt-36 pb-12 md:pt-48 md:pb-16">
      <div
        aria-hidden
        className="glow absolute -top-40 left-1/2 size-[60vmin] -translate-x-1/2 opacity-40"
      />
      <Container className="relative">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
              {[{ label: 'Home', href: '/' }, ...breadcrumbs].map((crumb) => (
                <li key={crumb.href} className="flex items-center gap-1.5">
                  <Link href={crumb.href} className="hover:text-fg">
                    {crumb.label}
                  </Link>
                  <ChevronRight className="size-3.5" aria-hidden />
                </li>
              ))}
              <li aria-current="page" className="max-w-[16rem] truncate text-fg">
                {title}
              </li>
            </ol>
          </nav>
        )}
        {eyebrow && (
          <p
            data-reveal="load"
            className="mb-4 flex items-center gap-3 font-mono text-xs tracking-[0.2em] text-accent-text uppercase"
          >
            <span className="h-px w-8 bg-accent" aria-hidden />
            {eyebrow}
          </p>
        )}
        <SplitHeading
          as="h1"
          immediate
          text={title}
          className={cn(
            'max-w-5xl leading-[1.02] font-semibold tracking-[-0.035em] text-balance',
            compact ? 'text-4xl md:text-6xl' : 'text-5xl md:text-8xl',
          )}
        />
        {description && (
          <p data-reveal="load" className="mt-6 max-w-2xl text-xl text-pretty text-muted">
            {description}
          </p>
        )}
        {children && (
          <div data-reveal="load" className="mt-8">
            {children}
          </div>
        )}
      </Container>
    </header>
  );
}
