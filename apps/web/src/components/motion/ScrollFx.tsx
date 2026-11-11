'use client';

import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { gsap, useScrollAnimation } from '@/lib/motion';

interface WrapperProps {
  children: ReactNode;
  className?: string;
}

/** Content that sinks back and fades as the visitor scrolls past it: the hero's exit. */
export function RecedeOnScroll({ children, className }: WrapperProps) {
  const ref = useRef<HTMLDivElement>(null);

  useScrollAnimation(ref, (element) => {
    gsap.to(element, {
      scale: 0.86,
      opacity: 0,
      yPercent: -8,
      ease: 'none',
      scrollTrigger: { trigger: element, start: 'top top', end: 'bottom top', scrub: true },
    });
  });

  return (
    <div ref={ref} className={cn('will-change-transform', className)}>
      {children}
    </div>
  );
}

/**
 * Turns a row of cards into a pinned, sideways-moving track on large screens: vertical
 * scrolling moves the row horizontally. On small screens, or without motion, it is an
 * ordinary swipeable row.
 */
export function HorizontalScroll({ children, className }: WrapperProps) {
  const ref = useRef<HTMLDivElement>(null);

  useScrollAnimation(
    ref,
    (section) => {
      const track = section.querySelector<HTMLElement>('[data-track]');
      if (!track) return;
      const distance = () => Math.max(0, track.scrollWidth - section.clientWidth);
      if (distance() === 0) return;

      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'center center',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
    },
    { media: '(min-width: 1024px)' },
  );

  return (
    <div ref={ref} className={cn('overflow-x-auto lg:overflow-visible', className)}>
      <div
        data-track
        className="flex w-max gap-6 px-6 will-change-transform lg:px-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))]"
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Sticky cards that stack on top of each other. As the next card arrives, the one
 * underneath shrinks and dims slightly, which reads as depth.
 */
export function StackedCards({ children, className }: WrapperProps) {
  const ref = useRef<HTMLDivElement>(null);

  useScrollAnimation(ref, (element) => {
    const cards = gsap.utils.toArray<HTMLElement>('[data-stack-card]', element);
    cards.slice(0, -1).forEach((card, index) => {
      gsap.to(card.firstElementChild, {
        scale: 1 - (cards.length - 1 - index) * 0.035,
        opacity: 0.55,
        ease: 'none',
        scrollTrigger: {
          trigger: cards[index + 1],
          start: 'top bottom',
          end: 'top 20%',
          scrub: true,
        },
      });
    });
  });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** A vertical line that draws itself as the visitor scrolls through its container. */
export function ProgressLine({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useScrollAnimation(ref, (element) => {
    gsap.fromTo(
      element,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: element.parentElement,
          start: 'top 70%',
          end: 'bottom 60%',
          scrub: true,
        },
      },
    );
  });

  return <div ref={ref} aria-hidden className={cn('origin-top bg-accent', className)} />;
}
