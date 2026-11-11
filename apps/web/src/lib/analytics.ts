import { PUBLIC_API_URL } from './env';

const COLLECT_URL = `${PUBLIC_API_URL}/analytics/collect`;

type EventProperties = Record<string, string | number | boolean>;

/**
 * Sends one record to the site's own, cookie-free analytics. `keepalive` lets the request
 * finish even if the visitor navigates away. Failures are ignored: statistics must never
 * get in the way of using the site.
 */
export async function collect<T = null>(body: object): Promise<T | null> {
  try {
    const response = await fetch(COLLECT_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    });
    return response.ok ? (((await response.json()) as { data: T }).data ?? null) : null;
  } catch {
    return null;
  }
}

/** For the moment a page is being closed, when only a beacon is guaranteed to be sent. */
export function collectOnExit(body: object): void {
  // A plain string is sent as text/plain, which needs no CORS preflight; the API accepts it.
  navigator.sendBeacon?.(COLLECT_URL, JSON.stringify(body));
}

/** Records something a visitor did, e.g. `trackEvent('booking_completed')`. Names are snake_case. */
export function trackEvent(name: string, properties?: EventProperties): void {
  void collect({ type: 'event', name, path: window.location.pathname, properties });
}
