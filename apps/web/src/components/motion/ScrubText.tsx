'use client';

import { useRef } from 'react';
import { cn } from '@/lib/cn';
import { gsap, useScrollAnimation } from '@/lib/motion';

/**
 * A paragraph that "lights up" word by word as the reader scrolls through it.
 * Without motion it is simply fully lit.
 */
export function ScrubText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useScrollAnimation(ref, (element) => {
    gsap.fromTo(
      element.querySelectorAll('span'),
      // Dim, but still above the 3:1 contrast that large text needs to stay readable.
      { opacity: 0.4 },
      {
        opacity: 1,
        stagger: 0.1,
        ease: 'none',
        scrollTrigger: { trigger: element, start: 'top 80%', end: 'bottom 55%', scrub: true },
      },
    );
  });

  return (
    <p ref={ref} className={cn(className)}>
      {text.split(/\s+/).map((word, index) => (
        <span key={index}>{word} </span>
      ))}
    </p>
  );
}
