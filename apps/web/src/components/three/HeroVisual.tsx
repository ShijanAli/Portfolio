'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { motionEnabled } from '@/lib/motion';

/** Phones with few cores get the lightweight gradient instead of WebGL. */
const isLowPowerDevice = () =>
  window.matchMedia('(max-width: 767px)').matches && (navigator.hardwareConcurrency ?? 8) <= 4;

/**
 * Decorative 3D backdrop of the hero. A CSS glow is always there; the WebGL scene is
 * downloaded and started only after the page is idle, and only where it will run well.
 * It fades in, so its late arrival never shifts or blocks the content.
 */
export function HeroVisual({ accentColor }: { accentColor: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canvas.current || !motionEnabled() || isLowPowerDevice()) return;

    let stop: (() => void) | undefined;
    let cancelled = false;

    const start = async () => {
      try {
        const { startHeroScene } = await import('./HeroScene');
        if (cancelled || !canvas.current) return;
        stop = startHeroScene(canvas.current, accentColor);
        setReady(true);
      } catch {
        // No WebGL: the CSS glow remains.
      }
    };

    const idle = window.requestIdleCallback?.(() => void start(), { timeout: 1500 });
    const timer = idle === undefined ? window.setTimeout(() => void start(), 300) : undefined;

    return () => {
      cancelled = true;
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timer !== undefined) window.clearTimeout(timer);
      stop?.();
    };
  }, [accentColor]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="glow absolute top-1/2 left-1/2 size-[70vmin] -translate-x-1/2 -translate-y-1/2 opacity-60" />
      <canvas
        ref={canvas}
        className={cn(
          'absolute inset-0 size-full transition-opacity duration-[1500ms]',
          ready ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />
    </div>
  );
}
