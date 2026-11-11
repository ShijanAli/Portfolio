import type { SectionKey, SiteSettings } from '@/lib/types';

/**
 * Header and footer links, in display order. A link is shown while its home page section
 * is switched on in the admin. Sections with a page of their own link to that page.
 */
const LINKS: { key: SectionKey; label: string; href: string }[] = [
  { key: 'about', label: 'About', href: '/#about' },
  { key: 'services', label: 'Services', href: '/services' },
  { key: 'projects', label: 'Work', href: '/projects' },
  { key: 'experience', label: 'Experience', href: '/#experience' },
  { key: 'blog', label: 'Blog', href: '/blog' },
  { key: 'contact', label: 'Contact', href: '/#contact' },
];

export interface NavLink {
  label: string;
  href: string;
}

export function navLinksOf(settings: SiteSettings): NavLink[] {
  const enabled = new Set(
    settings.sections.items.filter((item) => item.enabled).map((item) => item.key),
  );
  return LINKS.filter(({ key }) => enabled.has(key)).map(({ label, href }) => ({ label, href }));
}
