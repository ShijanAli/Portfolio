'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, type DependencyList, type RefObject } from 'react';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

/** True when the page should animate: set on <html> before first paint. */
export const motionEnabled = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('motion');

/**
 * Runs a GSAP setup scoped to an element, and reverts everything it created (tweens,
 * ScrollTriggers, inline styles) on unmount. Does nothing when motion is disabled.
 *
 * `media` limits the setup to a viewport, e.g. "(min-width: 1024px)"; it is torn down and
 * rebuilt automatically when the viewport crosses that boundary.
 */
export function useScrollAnimation<T extends HTMLElement>(
  ref: RefObject<T | null>,
  setup: (element: T) => void,
  { media = 'all', deps = [] }: { media?: string; deps?: DependencyList } = {},
) {
  useEffect(() => {
    const element = ref.current;
    if (!element || !motionEnabled()) return;

    const matcher = gsap.matchMedia(element);
    matcher.add(media, () => setup(element));
    return () => matcher.revert();
    // The setup function is recreated every render; `deps` says when it really changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
