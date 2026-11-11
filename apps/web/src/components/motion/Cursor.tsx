'use client';

import { useEffect, useRef } from 'react';
import { motionEnabled } from '@/lib/motion';

const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, summary, label[for]';

/**
 * A ring that trails the pointer, grows over anything clickable and can show a short
 * label (`data-cursor="View"` on any element). It is decoration only: the normal cursor
 * stays visible, and it is not created at all on touch devices or with reduced motion.
 */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ring.current;
    if (
      !element ||
      !motionEnabled() ||
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches
    )
      return;

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let frame = 0;

    // Ease toward the pointer, and stop the loop once the ring has caught up.
    const follow = () => {
      current.x += (target.x - current.x) * 0.18;
      current.y += (target.y - current.y) * 0.18;
      element.style.translate = `${current.x}px ${current.y}px`;
      const settled = Math.abs(target.x - current.x) < 0.1 && Math.abs(target.y - current.y) < 0.1;
      frame = settled ? 0 : requestAnimationFrame(follow);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      target.x = event.clientX;
      target.y = event.clientY;
      if (element.dataset.visible !== 'true') {
        // First movement: appear at the pointer instead of flying in from the corner.
        current.x = target.x;
        current.y = target.y;
        element.dataset.visible = 'true';
      }
      if (!frame) frame = requestAnimationFrame(follow);
    };

    const onOver = (event: PointerEvent) => {
      const hovered = event.target instanceof Element ? event.target : null;
      const text = hovered?.closest<HTMLElement>('[data-cursor]')?.dataset.cursor ?? '';
      element.dataset.state = text ? 'label' : hovered?.closest(INTERACTIVE) ? 'active' : 'idle';
      if (label.current) label.current.textContent = text;
    };

    const hide = () => (element.dataset.visible = 'false');

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    document.documentElement.addEventListener('pointerleave', hide);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      document.documentElement.removeEventListener('pointerleave', hide);
    };
  }, []);

  return (
    <div ref={ring} aria-hidden data-state="idle" data-visible="false" className="cursor-ring">
      <span ref={label} />
    </div>
  );
}
