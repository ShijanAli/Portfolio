'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { motionEnabled } from '@/lib/motion';

const INTERVAL_MS = 2600;

/**
 * Cycles through short phrases, e.g. job titles: the current one leaves upward while the
 * next rises from below. Screen readers get the whole list once instead of a stream of
 * changes; without motion the first phrase stays put.
 */
export function RotatingText({ items, className }: { items: string[]; className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2 || !motionEnabled()) return;
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % items.length),
      INTERVAL_MS,
    );
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;
  const previous = (index - 1 + items.length) % items.length;

  return (
    // Padding keeps descenders (g, j, y) inside the clipping box.
    <span
      className={cn('relative inline-grid overflow-hidden pb-[0.15em] align-bottom', className)}
    >
      <span className="sr-only">{items.join(', ')}</span>
      {items.map((item, position) => (
        <span
          key={item}
          aria-hidden
          className={cn(
            'col-start-1 row-start-1 whitespace-nowrap duration-700 ease-out-expo',
            position === index && 'translate-y-0 opacity-100 transition-all',
            // The phrase that was just showing slides out the top...
            position === previous &&
              position !== index &&
              '-translate-y-full opacity-0 transition-all',
            // ...and all others wait below, moved there instantly so they never cross the view.
            position !== index &&
              position !== previous &&
              'translate-y-full opacity-0 transition-none',
          )}
        >
          {item}
        </span>
      ))}
    </span>
  );
}
