'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

const STORAGE_KEY = 'analytics-consent';
const ID_PATTERN = /^G-[A-Z0-9]+$/;

type Consent = 'granted' | 'denied' | 'unknown';

/**
 * Google Analytics, loaded only after the visitor agrees. Google Analytics sets cookies,
 * so (unlike the site's own cookie-free statistics) it needs consent first. Nothing from
 * Google is requested before the visitor clicks "Allow".
 */
export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  // `null` until the stored choice has been read, so the banner never flashes for people who already chose.
  const [consent, setConsent] = useState<Consent | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage unavailable: ask again each visit.
    }
    setConsent(stored === 'granted' || stored === 'denied' ? stored : 'unknown');
  }, []);

  if (!ID_PATTERN.test(measurementId) || consent === null) return null;

  const choose = (choice: 'granted' | 'denied') => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // The choice still applies to this visit.
    }
    setConsent(choice);
  };

  if (consent === 'granted') {
    return (
      <>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
          strategy="lazyOnload"
        />
        <Script id="ga4-init" strategy="lazyOnload">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${measurementId}',{anonymize_ip:true});`}
        </Script>
      </>
    );
  }

  if (consent === 'denied') return null;

  return (
    <div
      role="dialog"
      aria-label="Analytics cookies"
      className="fixed inset-x-4 bottom-4 z-[65] mx-auto max-w-xl rounded-3xl border border-border bg-surface/95 p-5 shadow-2xl backdrop-blur-xl"
    >
      <p className="text-sm text-muted">
        May I use Google Analytics cookies to understand how this site is used? The site works the
        same either way.
      </p>
      <div className="mt-4 flex gap-2">
        <Button className="h-9 px-4" onClick={() => choose('granted')}>
          Allow
        </Button>
        <Button variant="secondary" className="h-9 px-4" onClick={() => choose('denied')}>
          No thanks
        </Button>
      </div>
    </div>
  );
}
