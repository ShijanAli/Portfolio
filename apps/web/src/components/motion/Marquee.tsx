import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface MarqueeProps {
  children: ReactNode;
  /** Seconds for one full loop. */
  duration?: number;
  reverse?: boolean;
  className?: string;
}

/**
 * An endless horizontal ticker. The content is rendered twice so the loop is seamless;
 * the copy is hidden from assistive technology. Pauses while hovered or focused.
 */
export function Marquee({ children, duration = 40, reverse, className }: MarqueeProps) {
  return (
    <div
      className={cn(
        'group flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]',
        className,
      )}
    >
      <div
        className="flex w-max animate-marquee group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused]"
        style={
          {
            '--marquee-duration': `${duration}s`,
            animationDirection: reverse ? 'reverse' : 'normal',
          } as CSSProperties
        }
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
