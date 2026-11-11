'use client';

import { useEffect } from 'react';
import { PUBLIC_API_URL } from '@/lib/env';

/**
 * Counts one view of a project or article per browser tab session. Pages are served from
 * cache, so the count has to be reported from the visitor's browser.
 */
export function ViewCounter({ resource, slug }: { resource: 'projects' | 'blogs'; slug: string }) {
  useEffect(() => {
    const key = `viewed:${resource}:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // Storage unavailable (private mode): count the view anyway.
    }
    void fetch(`${PUBLIC_API_URL}/${resource}/slug/${encodeURIComponent(slug)}/view`, {
      method: 'POST',
      keepalive: true,
    }).catch(() => undefined);
  }, [resource, slug]);

  return null;
}
