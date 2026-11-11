import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { ApiError } from '@/common/utils/api-error';

/**
 * Minimal Google Analytics 4 Data API client (service account, read-only).
 * Uses plain HTTPS instead of the Google SDK to keep the dependency footprint small.
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const API_BASE = 'https://analyticsdata.googleapis.com/v1beta';

export const isGa4Configured = Boolean(
  env.GA4_PROPERTY_ID && env.GA4_CLIENT_EMAIL && env.GA4_PRIVATE_KEY,
);

let cachedToken: { value: string; expiresAt: number } | undefined;

const unavailable = (detail: string) =>
  new ApiError(502, 'GA4_UNAVAILABLE', `Google Analytics request failed: ${detail}`);

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const assertion = jwt.sign({ scope: SCOPE }, env.GA4_PRIVATE_KEY ?? '', {
    algorithm: 'RS256',
    issuer: env.GA4_CLIENT_EMAIL,
    audience: TOKEN_URL,
    expiresIn: 3600,
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw unavailable(`token ${response.status}`);

  const body = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return cachedToken.value;
}

interface ReportRow {
  dimensionValues?: { value: string }[];
  metricValues?: { value: string }[];
}

async function run(method: 'runReport' | 'runRealtimeReport', body: object): Promise<ReportRow[]> {
  const response = await fetch(`${API_BASE}/properties/${env.GA4_PROPERTY_ID}:${method}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${await getAccessToken()}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw unavailable(`${method} ${response.status}`);

  const data = (await response.json()) as { rows?: ReportRow[] };
  return data.rows ?? [];
}

const METRICS = ['activeUsers', 'sessions', 'screenPageViews', 'averageSessionDuration'] as const;
const numbers = (row: ReportRow | undefined) =>
  Object.fromEntries(
    METRICS.map((name, index) => [name, Number(row?.metricValues?.[index]?.value ?? 0)]),
  );

/** Totals, a daily series and the current number of active users for a date range. */
export async function getGa4Report(from: string, to: string) {
  const request = {
    dateRanges: [{ startDate: from, endDate: to }],
    metrics: METRICS.map((name) => ({ name })),
  };

  const [totals, daily, realtime] = await Promise.all([
    run('runReport', request),
    run('runReport', {
      ...request,
      dimensions: [{ name: 'date' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }),
    run('runRealtimeReport', { metrics: [{ name: 'activeUsers' }] }),
  ]);

  return {
    totals: numbers(totals[0]),
    // GA4 returns dates as YYYYMMDD.
    timeseries: daily.map((row) => ({
      date: (row.dimensionValues?.[0]?.value ?? '').replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
      ...numbers(row),
    })),
    activeUsers: Number(realtime[0]?.metricValues?.[0]?.value ?? 0),
  };
}
