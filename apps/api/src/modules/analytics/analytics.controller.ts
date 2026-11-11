import type { Request, Response } from 'express';
import { DateTime } from 'luxon';
import { ok } from '@/common/utils/api-response';
import { isBot } from '@/common/utils/user-agent';
import { getGa4Report, isGa4Configured } from '@/lib/ga4';
import { collect } from './analytics.collector';
import type { BreakdownQuery, CollectInput, RangeQuery } from './analytics.schema';
import { analyticsService } from './analytics.service';

/** Two-letter country code set by the CDN in front of the API, when there is one. */
function countryOf(req: Request): string | undefined {
  const code = req.get('cf-ipcountry') ?? req.get('x-vercel-ip-country');
  return code && /^[A-Z]{2}$/.test(code) && code !== 'XX' ? code : undefined;
}

export const analyticsController = {
  collect: async (req: Request, res: Response) => {
    const userAgent = req.get('user-agent');
    // Bots get a normal response, but leave no trace in the statistics.
    if (isBot(userAgent)) {
      ok(res, null);
      return;
    }

    const result = await collect(req.body as CollectInput, {
      ip: req.ip ?? '',
      userAgent: userAgent ?? '',
      country: countryOf(req),
      city: req.get('x-vercel-ip-city')?.slice(0, 100),
    });
    ok(res, result);
  },

  overview: async (req: Request, res: Response) => {
    ok(res, await analyticsService.getOverview(req.query as unknown as RangeQuery));
  },

  breakdown: async (req: Request, res: Response) => {
    ok(res, await analyticsService.getBreakdown(req.query as unknown as BreakdownQuery));
  },

  realtime: async (_req: Request, res: Response) => {
    ok(res, await analyticsService.getRealtime());
  },

  /** Google Analytics numbers for the same range, when a GA4 property is connected. */
  ga4: async (req: Request, res: Response) => {
    if (!isGa4Configured) {
      ok(res, { configured: false });
      return;
    }
    const { from, to, timezone } = req.query as unknown as RangeQuery;
    const today = DateTime.now().setZone(timezone);
    const report = await getGa4Report(
      from ?? today.minus({ days: 29 }).toISODate() ?? '30daysAgo',
      to ?? today.toISODate() ?? 'today',
    );
    ok(res, { configured: true, ...report });
  },
};
