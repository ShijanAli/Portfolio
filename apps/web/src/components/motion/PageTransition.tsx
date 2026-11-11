'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Fades each page in. Keying the wrapper by the path gives every page a fresh element, so
 * the CSS entrance animation (`.page-enter`) restarts on every navigation, including
 * between a list and its detail pages. Changing only the query string (filters,
 * pagination) keeps the same element and does not re-animate.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
