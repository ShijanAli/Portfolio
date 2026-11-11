import type { CSSProperties, ElementType } from 'react';
import { cn } from '@/lib/cn';

interface SplitHeadingProps {
  text: string;
  as?: ElementType;
  className?: string;
  /** Delay before the first word rises, in milliseconds. */
  delay?: number;
  /** Animate with the first paint instead of on scroll. For headings above the fold. */
  immediate?: boolean;
}

/**
 * A heading whose words rise into place one after another when it scrolls into view.
 * Rendered on the server as ordinary text, so it reads normally to search engines and
 * screen readers, and without JavaScript.
 */
export function SplitHeading({
  text,
  as: Tag = 'h2',
  className,
  delay = 0,
  immediate,
}: SplitHeadingProps) {
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <Tag
      // "load" animates in CSS with the first paint; otherwise it waits to scroll into view.
      data-split={immediate ? 'load' : ''}
      className={cn(className)}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {words.map((word, index) => (
        <span key={index} className="split-word">
          <span style={{ '--word-index': index } as CSSProperties}>{word}</span>
          {index < words.length - 1 && ' '}
        </span>
      ))}
    </Tag>
  );
}
