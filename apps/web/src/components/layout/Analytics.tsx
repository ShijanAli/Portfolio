'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { collect, collectOnExit } from '@/lib/analytics';

/** Query parameters that say which campaign a visitor arrived from. */
function campaignOf(search: string) {
  const params = new URLSearchParams(search);
  const pick = (name: string) => params.get(name)?.slice(0, 100) || undefined;
  return {
    utmSource: pick('utm_source'),
    utmMedium: pick('utm_medium'),
    utmCampaign: pick('utm_campaign'),
  };
}

const scrollDepth = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  return scrollable <= 0 ? 100 : Math.min(100, Math.round((window.scrollY / scrollable) * 100));
};

/**
 * Reports page views to the site's own analytics: which page, and on leaving it, how long
 * the visitor stayed and how far they scrolled. No cookies and no identifiers are stored
 * in the browser. Mounted once in the root layout.
 */
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    const startedAt = Date.now();
    let pageViewId: string | null = null;
    let maxDepth = scrollDepth();
    let reported = false;

    void collect<{ pageViewId: string }>({
      type: 'pageview',
      path: pathname,
      title: document.title,
      referrer: document.referrer || undefined,
      ...campaignOf(window.location.search),
    }).then((result) => (pageViewId = result?.pageViewId ?? null));

    const onScroll = () => (maxDepth = Math.max(maxDepth, scrollDepth()));

    /** Sent once per page view: when the tab is hidden or closed, or on navigating away. */
    const reportLeave = () => {
      if (reported || !pageViewId) return;
      reported = true;
      collectOnExit({
        type: 'leave',
        pageViewId,
        duration: Math.min(86_400, Math.round((Date.now() - startedAt) / 1000)),
        scrollDepth: maxDepth,
      });
    };
    const onVisibilityChange = () => document.visibilityState === 'hidden' && reportLeave();

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', reportLeave);

    return () => {
      reportLeave();
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', reportLeave);
    };
  }, [pathname]);

  return null;
}
