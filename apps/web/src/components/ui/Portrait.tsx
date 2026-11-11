import Image from 'next/image';
import { Tilt } from '@/components/motion/Pointer';
import { cn } from '@/lib/cn';

interface PortraitProps {
  src: string;
  alt: string;
  /** Load immediately, for a portrait that is visible without scrolling. */
  priority?: boolean;
  /** Width the image is displayed at, so the browser can pick the smallest file that fits. */
  sizes: string;
  className?: string;
}

/** A framed photo with an accent glow behind it and a gentle 3D tilt under the pointer. */
export function Portrait({ src, alt, priority, sizes, className }: PortraitProps) {
  return (
    <div className={cn('relative', className)}>
      <div aria-hidden className="glow absolute -inset-10 opacity-60" />
      <Tilt max={5}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-border bg-surface">
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes={sizes}
            className="object-cover"
          />
          {/* Blends the bottom of the photo into the page. */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-bg/70 to-transparent"
          />
        </div>
      </Tilt>
    </div>
  );
}
