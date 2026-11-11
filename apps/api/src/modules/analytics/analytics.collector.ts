import { createHmac } from 'node:crypto';
import { env } from '@/config/env';
import { parseUserAgent } from '@/common/utils/user-agent';
import { prisma } from '@/lib/prisma';
import type { CollectInput } from './analytics.schema';

/** What the server knows about the request. None of it is stored as-is. */
export interface ClientInfo {
  ip: string;
  userAgent: string;
  country?: string;
  city?: string;
}

type PageViewInput = Extract<CollectInput, { type: 'pageview' }>;
type LeaveInput = Extract<CollectInput, { type: 'leave' }>;
type EventInput = Extract<CollectInput, { type: 'event' }>;

/** A visit ends after this much inactivity; the next hit starts a new session. */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const OWN_HOST = new URL(env.WEB_URL).hostname;

/**
 * Anonymous visitor id. The date is part of the key, so the same person gets a different,
 * unlinkable id every day, and the IP address itself is never written anywhere.
 */
function visitorHashOf({ ip, userAgent }: ClientInfo): string {
  const day = new Date().toISOString().slice(0, 10);
  return createHmac('sha256', env.JWT_ACCESS_SECRET)
    .update(`${day}|${ip}|${userAgent}`)
    .digest('hex');
}

/** External referrers are reduced to their host. Navigation within the site is not a referrer. */
function referrerHostOf(referrer: string | undefined): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    return host === OWN_HOST.replace(/^www\./, '') ? null : host;
  } catch {
    return null;
  }
}

/** Finds the visitor's current session, or starts one. */
async function resolveSession(client: ClientInfo, entry?: PageViewInput): Promise<string> {
  const now = new Date();
  const { country, city } = client;

  const visitor = await prisma.visitor.upsert({
    where: { visitorHash: visitorHashOf(client) },
    update: { lastSeenAt: now },
    create: {
      visitorHash: visitorHashOf(client),
      country,
      city,
      ...parseUserAgent(client.userAgent),
    },
  });

  const current = await prisma.visitorSession.findFirst({
    where: {
      visitorId: visitor.id,
      lastSeenAt: { gte: new Date(now.getTime() - SESSION_TIMEOUT_MS) },
    },
    orderBy: { lastSeenAt: 'desc' },
  });

  if (current) {
    await prisma.visitorSession.update({ where: { id: current.id }, data: { lastSeenAt: now } });
    return current.id;
  }

  const session = await prisma.visitorSession.create({
    data: {
      visitorId: visitor.id,
      landingPage: entry?.path ?? '/',
      referrer: referrerHostOf(entry?.referrer),
      utmSource: entry?.utmSource,
      utmMedium: entry?.utmMedium,
      utmCampaign: entry?.utmCampaign,
    },
  });
  return session.id;
}

async function recordPageView(input: PageViewInput, client: ClientInfo) {
  const sessionId = await resolveSession(client, input);
  const pageView = await prisma.pageView.create({
    data: { sessionId, path: input.path, title: input.title },
  });
  return { pageViewId: pageView.id };
}

/** Only the visitor who created a page view can complete it. */
async function recordLeave(input: LeaveInput, client: ClientInfo) {
  await prisma.pageView.updateMany({
    where: { id: input.pageViewId, session: { visitor: { visitorHash: visitorHashOf(client) } } },
    data: { duration: input.duration, scrollDepth: input.scrollDepth },
  });
  return null;
}

async function recordEvent(input: EventInput, client: ClientInfo) {
  const sessionId = await resolveSession(client);
  await prisma.analyticsEvent.create({
    data: { sessionId, name: input.name, path: input.path, properties: input.properties },
  });
  return null;
}

export function collect(input: CollectInput, client: ClientInfo) {
  switch (input.type) {
    case 'pageview':
      return recordPageView(input, client);
    case 'leave':
      return recordLeave(input, client);
    case 'event':
      return recordEvent(input, client);
  }
}
