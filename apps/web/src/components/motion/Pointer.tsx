'use client';

import { useRef, type PointerEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { motionEnabled } from '@/lib/motion';

interface PointerProps {
  children: ReactNode;
  className?: string;
}

/** Pulls its content a few pixels toward the pointer, like a magnet. */
export function Magnetic({
  children,
  className,
  strength = 0.3,
}: PointerProps & { strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  const onMove = (event: PointerEvent<HTMLSpanElement>) => {
    if (!ref.current || !motionEnabled() || event.pointerType !== 'mouse') return;
    const box = ref.current.getBoundingClientRect();
    const x = (event.clientX - box.left - box.width / 2) * strength;
    const y = (event.clientY - box.top - box.height / 2) * strength;
    ref.current.style.transform = `translate(${x}px, ${y}px)`;
  };

  return (
    <span
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => ref.current && (ref.current.style.transform = '')}
      className={cn('inline-block transition-transform duration-300 ease-out', className)}
    >
      {children}
    </span>
  );
}

/**
 * Tilts a card in 3D toward the pointer and moves a soft highlight under it.
 * The highlight reads two CSS variables, --pointer-x and --pointer-y.
 */
export function Tilt({ children, className, max = 7 }: PointerProps & { max?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const element = ref.current;
    if (!element || !motionEnabled() || event.pointerType !== 'mouse') return;
    const box = element.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    element.style.transform = `perspective(900px) rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg)`;
    element.style.setProperty('--pointer-x', `${x * 100}%`);
    element.style.setProperty('--pointer-y', `${y * 100}%`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => ref.current && (ref.current.style.transform = '')}
      className={cn('transition-transform duration-300 ease-out will-change-transform', className)}
    >
      {children}
    </div>
  );
}
