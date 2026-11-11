import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata, Viewport } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { Analytics } from '@/components/layout/Analytics';
import { Footer } from '@/components/layout/Footer';
import { GoogleAnalytics } from '@/components/layout/GoogleAnalytics';
import { Header } from '@/components/layout/Header';
import { JsonLd } from '@/components/layout/JsonLd';
import { navLinksOf } from '@/components/layout/navigation';
import { MOTION_INIT_SCRIPT, MotionRoot } from '@/components/motion/MotionRoot';
import { getSettings } from '@/lib/api';
import { buildSiteJsonLd, siteUrlOf } from '@/lib/seo';
import './globals.css';

export const viewport: Viewport = { themeColor: '#07070b', colorScheme: 'dark' };

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const { seo, general } = settings;

  return {
    metadataBase: new URL(siteUrlOf(settings)),
    title: { default: seo.defaultTitle, template: seo.titleTemplate },
    description: seo.defaultDescription,
    applicationName: general.siteName,
    authors: general.ownerName ? [{ name: general.ownerName }] : undefined,
    icons: general.favicon ? { icon: general.favicon } : undefined,
    verification: seo.googleSiteVerification ? { google: seo.googleSiteVerification } : undefined,
  };
}

/** Only a well-formed hex color from the admin is ever written into the page's style. */
const safeAccent = (color: string) => (/^#[0-9a-f]{6}$/i.test(color) ? color : '#7c5cff');

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  const links = navLinksOf(settings);

  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      style={{ '--accent': safeAccent(settings.theme.accentColor) } as CSSProperties}
      // The inline script below adds a class to <html> before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_INIT_SCRIPT }} />
      </head>
      <body className="grain">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[70] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <Header siteName={settings.general.siteName} links={links} cta={settings.hero.primaryCta} />
        <main id="main">{children}</main>
        <Footer settings={settings} links={links} />
        <MotionRoot />
        <Analytics />
        {settings.integrations.gaMeasurementId && (
          <GoogleAnalytics measurementId={settings.integrations.gaMeasurementId} />
        )}
        <JsonLd data={buildSiteJsonLd(settings)} />
      </body>
    </html>
  );
}
