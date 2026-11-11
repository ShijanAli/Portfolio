'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { NavLink } from './navigation';

interface HeaderProps {
  siteName: string;
  links: NavLink[];
  cta: NavLink;
}

export function Header({ siteName, links, cta }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The page behind an open menu must not scroll, and Escape closes the menu.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div
        className={cn(
          'mx-auto flex h-14 max-w-7xl items-center justify-between rounded-full border px-5 transition-colors duration-300',
          scrolled || menuOpen
            ? 'border-border bg-surface/80 backdrop-blur-xl'
            : 'border-transparent',
        )}
      >
        <Link
          href="/"
          className="text-base font-semibold tracking-tight"
          onClick={() => setMenuOpen(false)}
        >
          {siteName}
          <span className="text-accent-text">.</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-fg"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink href={cta.href} className="hidden h-9 px-4 sm:inline-flex">
            {cta.label}
          </ButtonLink>
          <button
            type="button"
            className="grid size-9 cursor-pointer place-items-center rounded-full text-fg md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <nav
        id="mobile-menu"
        aria-label="Mobile"
        hidden={!menuOpen}
        className="mx-auto mt-2 max-w-7xl rounded-3xl border border-border bg-surface/95 p-4 backdrop-blur-xl md:hidden"
      >
        <ul>
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-2xl px-4 py-3 text-lg hover:bg-raised"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <ButtonLink href={cta.href} className="mt-3 w-full" onClick={() => setMenuOpen(false)}>
          {cta.label}
        </ButtonLink>
      </nav>
    </header>
  );
}
