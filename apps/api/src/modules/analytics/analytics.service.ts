import { Prisma } from '@prisma/client';
import { DateTime } from 'luxon';
import { prisma } from '@/lib/prisma';
import type { BreakdownQuery, Dimension, RangeQuery } from './analytics.schema';

interface Range {
  start: Date;
  end: Date;
  from: string;
  to: string;
  timezone: string;
}

interface Totals {
  views: number;
  visitors: number;
  sessions: number;
  avgDuration: number;
  bounceRate: number;
}

const DEFAULT_RANGE_DAYS = 30;
const REALTIME_WINDOW_MS = 5 * 60 * 1000;

/** Page views joined to their session and visitor: the base of every report. */
const PAGE_VIEWS = Prisma.sql`
  FROM "PageView" pv
  JOIN "VisitorSession" s ON s.id = pv."sessionId"
  JOIN "Visitor" v ON v.id = s."visitorId"`;

/**
 * What each dimension groups by. These are fixed SQL fragments chosen by a validated enum,
 * never text from the request.
 */
const GROUP_BY: Record<Exclude<Dimension, 'events'>, Prisma.Sql> = {
  pages: Prisma.sql`pv.path`,
  referrers: Prisma.sql`coalesce(s.referrer, 'Direct')`,
  sources: Prisma.sql`coalesce(s."utmSource", 'None')`,
  countries: Prisma.sql`coalesce(v.country, 'Unknown')`,
  devices: Prisma.sql`coalesce(v.device, 'Unknown')`,
  browsers: Prisma.sql`coalesce(v.browser, 'Unknown')`,
  systems: Prisma.sql`coalesce(v.os, 'Unknown')`,
};

function resolveRange({ from, to, timezone }: RangeQuery): Range {
  const lastDay = to ? DateTime.fromISO(to, { zone: timezone }) : DateTime.now().setZone(timezone);
  const firstDay = from
    ? DateTime.fromISO(from, { zone: timezone })
    : lastDay.minus({ days: DEFAULT_RANGE_DAYS - 1 });

  return {
    start: firstDay.startOf('day').toJSDate(),
    end: lastDay.endOf('day').toJSDate(),
    from: firstDay.toISODate() ?? '',
    to: lastDay.toISODate() ?? '',
    timezone,
  };
}

const within = (column: Prisma.Sql, { start, end }: Pick<Range, 'start' | 'end'>) =>
  Prisma.sql`${column} >= ${start} AND ${column} <= ${end}`;

async function totalsFor(range: Pick<Range, 'start' | 'end'>): Promise<Totals> {
  const inRange = within(Prisma.sql`pv."createdAt"`, range);

  const [[totals], [bounce]] = await Promise.all([
    prisma.$queryRaw<Omit<Totals, 'bounceRate'>[]>`
      SELECT count(*)::int AS views,
             count(DISTINCT s."visitorId")::int AS visitors,
             count(DISTINCT pv."sessionId")::int AS sessions,
             coalesce(round(avg(pv.duration)), 0)::int AS "avgDuration"
      ${PAGE_VIEWS}
      WHERE ${inRange}`,
    // A bounce is a session that viewed exactly one page.
    prisma.$queryRaw<{ bounced: number; total: number }[]>`
      SELECT count(*) FILTER (WHERE pages = 1)::int AS bounced, count(*)::int AS total
      FROM (SELECT count(*) AS pages FROM "PageView" pv WHERE ${inRange} GROUP BY pv."sessionId") t`,
  ]);

  const bounceRate = bounce?.total ? Math.round((bounce.bounced / bounce.total) * 100) : 0;
  return { views: 0, visitors: 0, sessions: 0, avgDuration: 0, ...totals, bounceRate };
}

class AnalyticsService {
  /** Totals, the same totals for the preceding period, and one data point per day. */
  async getOverview(query: RangeQuery) {
    const range = resolveRange(query);
    const length = range.end.getTime() - range.start.getTime();
    const previous = {
      start: new Date(range.start.getTime() - length - 1),
      end: new Date(range.start.getTime() - 1),
    };

    const [totals, previousTotals, timeseries] = await Promise.all([
      totalsFor(range),
      totalsFor(previous),
      prisma.$queryRaw<{ date: string; views: number; visitors: number }[]>`
        SELECT to_char(day, 'YYYY-MM-DD') AS date,
               coalesce(stats.views, 0)::int AS views,
               coalesce(stats.visitors, 0)::int AS visitors
        FROM generate_series(${range.from}::date, ${range.to}::date, interval '1 day') AS day
        LEFT JOIN (
          SELECT (pv."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${range.timezone})::date AS local_day,
                 count(*) AS views,
                 count(DISTINCT s."visitorId") AS visitors
          ${PAGE_VIEWS}
          WHERE ${within(Prisma.sql`pv."createdAt"`, range)}
          GROUP BY 1
        ) stats ON stats.local_day = day::date
        ORDER BY day`,
    ]);

    return {
      range: { from: range.from, to: range.to, timezone: range.timezone },
      totals,
      previousTotals,
      timeseries,
    };
  }

  /** Top values of one dimension, e.g. most viewed pages or most common countries. */
  async getBreakdown({ dimension, limit, ...query }: BreakdownQuery) {
    const range = resolveRange(query);

    if (dimension === 'events') {
      return prisma.$queryRaw<{ label: string; views: number; visitors: number }[]>`
        SELECT e.name AS label, count(*)::int AS views, count(DISTINCT s."visitorId")::int AS visitors
        FROM "AnalyticsEvent" e
        JOIN "VisitorSession" s ON s.id = e."sessionId"
        WHERE ${within(Prisma.sql`e."createdAt"`, range)}
        GROUP BY 1 ORDER BY views DESC, label LIMIT ${limit}`;
    }

    return prisma.$queryRaw<{ label: string; views: number; visitors: number }[]>`
      SELECT ${GROUP_BY[dimension]} AS label,
             count(*)::int AS views,
             count(DISTINCT s."visitorId")::int AS visitors
      ${PAGE_VIEWS}
      WHERE ${within(Prisma.sql`pv."createdAt"`, range)}
      GROUP BY 1 ORDER BY views DESC, label LIMIT ${limit}`;
  }

  /** Who is on the site right now. */
  async getRealtime() {
    const since = new Date(Date.now() - REALTIME_WINDOW_MS);
    const [activeSessions, pages] = await Promise.all([
      prisma.visitorSession.findMany({
        where: { lastSeenAt: { gte: since } },
        select: { visitorId: true },
        distinct: ['visitorId'],
      }),
      prisma.pageView.groupBy({
        by: ['path'],
        where: { createdAt: { gte: since } },
        _count: true,
        orderBy: { _count: { path: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      activeVisitors: activeSessions.length,
      pages: pages.map(({ path, _count }) => ({ path, views: _count })),
    };
  }

  /** Raw analytics rows are kept for a limited time. Sessions and views go with the visitor. */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const { count } = await prisma.visitor.deleteMany({ where: { lastSeenAt: { lt: cutoff } } });
    return count;
  }
}

export const analyticsService = new AnalyticsService();
