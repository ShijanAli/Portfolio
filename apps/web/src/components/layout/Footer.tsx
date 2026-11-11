import Link from 'next/link';
import { NewsletterForm } from '@/components/forms/NewsletterForm';
import { Container } from '@/components/ui/Section';
import type { SiteSettings } from '@/lib/types';
import type { NavLink } from './navigation';

const SOCIAL_LABELS: Record<string, string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  twitter: 'X',
  facebook: 'Facebook',
  youtube: 'YouTube',
  whatsapp: 'WhatsApp',
  upwork: 'Upwork',
  fiverr: 'Fiverr',
};

export function Footer({ settings, links }: { settings: SiteSettings; links: NavLink[] }) {
  const { general } = settings;
  const socials = Object.entries(settings.socials).filter((entry): entry is [string, string] =>
    Boolean(entry[1]),
  );

  return (
    <footer className="border-t border-border pt-16 pb-10">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <p className="text-xl font-semibold tracking-tight">
              {general.siteName}
              <span className="text-accent-text">.</span>
            </p>
            {general.tagline && <p className="mt-2 max-w-sm text-muted">{general.tagline}</p>}
            <p className="mt-8 mb-3 text-sm text-muted">Get new posts and projects by email.</p>
            <NewsletterForm source="footer" className="max-w-md" />
          </div>

          <nav aria-label="Footer">
            <p className="mb-4 font-mono text-xs tracking-[0.2em] text-muted uppercase">Explore</p>
            <ul className="space-y-2.5">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted transition-colors hover:text-fg">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {socials.length > 0 && (
            <div>
              <p className="mb-4 font-mono text-xs tracking-[0.2em] text-muted uppercase">
                Elsewhere
              </p>
              <ul className="space-y-2.5">
                {socials.map(([key, url]) => (
                  <li key={key}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer me"
                      className="text-muted transition-colors hover:text-fg"
                    >
                      {SOCIAL_LABELS[key] ?? key}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <p className="mt-16 text-sm text-muted">
          © {new Date().getFullYear()} {general.ownerName || general.siteName}. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
