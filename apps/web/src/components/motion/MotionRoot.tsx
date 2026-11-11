'use client';

import Lenis from 'lenis';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { gsap, motionEnabled, ScrollTrigger } from '@/lib/motion';

/**
 * Inline script for <head>: decides before first paint whether the page animates.
 * Running it this early is what prevents content from flashing visible and then hiding.
 */
export const MOTION_INIT_SCRIPT = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('motion')}catch(e){}`;

/** Momentum scrolling, driven by GSAP's clock so scroll-linked animations stay in step. */
function useSmoothScroll() {
  useEffect(() => {
    if (!motionEnabled()) return;

    const lenis = new Lenis({ lerp: 0.1, anchors: true });
    const onTick = (time: number) => lenis.raf(time * 1000);

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, []);
}

/**
 * Marks `[data-reveal]` and `[data-split]` elements as visible when they scroll into view.
 * One observer serves the whole page, so server components opt in with just an attribute.
 */
function useRevealOnScroll(pathname: string) {
  useEffect(() => {
    // Elements marked "load" animate by themselves in CSS and need no observer.
    const targets = document.querySelectorAll(
      '[data-reveal]:not([data-reveal="load"]), [data-split]:not([data-split="load"])',
    );
    if (!motionEnabled()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [pathname]);
}

/** Mounted once in the root layout. Renders nothing. */
export function MotionRoot() {
  const pathname = usePathname();
  useSmoothScroll();
  useRevealOnScroll(pathname);
  return null;
}
