import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { api, createTestAdmin, unique, url } from '@/tests/helpers';

let auth: { Authorization: string };
let adminId: string;

const CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

// Unique per run, so the numbers asserted below are not affected by existing data.
const base = `/${unique('t')}`;
const randomIp = () => `203.0.113.${Math.floor(Math.random() * 250) + 1}`;
const alice = { ip: randomIp(), userAgent: `${CHROME} ${base}` };
const bob = { ip: randomIp(), userAgent: `${IPHONE} ${base}` };

const send = (visitor: typeof alice, body: object) =>
  api()
    .post(url('/analytics/collect'))
    .set('User-Agent', visitor.userAgent)
    .set('X-Forwarded-For', visitor.ip)
    .send(body);

const pageView = (visitor: typeof alice, path: string, extra: object = {}) =>
  send(visitor, { type: 'pageview', path: `${base}${path}`, ...extra });

const overview = async () =>
  (await api().get(url('/analytics/overview')).set(auth)).body.data.totals;
const viewsOf = (path: string) => prisma.pageView.findMany({ where: { path: `${base}${path}` } });

beforeAll(async () => {
  const admin = await createTestAdmin();
  auth = admin.auth;
  adminId = admin.user.id;
});

afterAll(async () => {
  await prisma.visitor.deleteMany({
    where: { sessions: { some: { landingPage: { startsWith: base } } } },
  });
  await prisma.tag.deleteMany({ where: { name: { startsWith: 'audit-' } } });
  await prisma.auditLog.deleteMany({ where: { OR: [{ userId: adminId }, { userId: null }] } });
  await prisma.user.delete({ where: { id: adminId } });
  await prisma.$disconnect();
});

describe('analytics collector', () => {
  let before: { views: number; visitors: number; sessions: number };
  let alicePageViewId: string;

  beforeAll(async () => {
    before = await overview();
  });

  it('ignores bots', async () => {
    await api()
      .post(url('/analytics/collect'))
      .set('User-Agent', 'Googlebot/2.1')
      .send({ type: 'pageview', path: `${base}/bot` })
      .expect(200);

    expect(await viewsOf('/bot')).toHaveLength(0);
  });

  it('records a page view without the query string, and the external referrer host', async () => {
    const res = await pageView(alice, '/pricing?email=someone@example.com', {
      referrer: 'https://www.google.com/search?q=developer',
      utmSource: 'newsletter',
    });

    expect(res.status).toBe(200);
    alicePageViewId = res.body.data.pageViewId;

    const [stored] = await prisma.pageView.findMany({
      where: { path: `${base}/pricing` },
      include: { session: { include: { visitor: true } } },
    });
    expect(stored?.session.referrer).toBe('google.com');
    expect(stored?.session.utmSource).toBe('newsletter');
    expect(stored?.session.visitor).toMatchObject({
      device: 'desktop',
      browser: 'Chrome',
      os: 'Windows',
    });
    expect(JSON.stringify(stored)).not.toContain(alice.ip);
  });

  it('keeps later page views of the same visitor in one session', async () => {
    await pageView(alice, '/about', { referrer: 'http://localhost:3000/pricing' });

    const sessions = await prisma.visitorSession.findMany({
      where: { landingPage: `${base}/pricing` },
    });
    expect(sessions).toHaveLength(1);
    expect(await prisma.pageView.count({ where: { sessionId: sessions[0]!.id } })).toBe(2);
  });

  it('accepts beacons sent as text/plain', async () => {
    await api()
      .post(url('/analytics/collect'))
      .set('User-Agent', bob.userAgent)
      .set('X-Forwarded-For', bob.ip)
      .type('text/plain')
      .send(JSON.stringify({ type: 'pageview', path: `${base}/blog` }))
      .expect(200);

    expect(await viewsOf('/blog')).toHaveLength(1);
  });

  it('lets only the same visitor complete a page view', async () => {
    const leave = { type: 'leave', pageViewId: alicePageViewId, duration: 42, scrollDepth: 80 };

    await send(bob, leave).expect(200);
    expect((await viewsOf('/pricing'))[0]?.duration).toBeNull();

    await send(alice, leave).expect(200);
    expect((await viewsOf('/pricing'))[0]).toMatchObject({ duration: 42, scrollDepth: 80 });
  });

  it('records custom events and rejects malformed ones', async () => {
    await send(alice, { type: 'event', name: 'cv_download', properties: { format: 'pdf' } }).expect(
      200,
    );
    expect((await send(alice, { type: 'event', name: 'Not Snake Case' })).status).toBe(422);
    expect((await send(alice, { type: 'pageview', path: 'no-leading-slash' })).status).toBe(422);
  });

  it('reports totals, a daily series and a comparison period to admins only', async () => {
    expect((await api().get(url('/analytics/overview'))).status).toBe(401);

    const res = await api().get(url('/analytics/overview')).set(auth);
    const { totals, timeseries, previousTotals } = res.body.data;

    expect(totals.views - before.views).toBe(3);
    expect(totals.visitors - before.visitors).toBe(2);
    expect(totals.sessions - before.sessions).toBe(2);
    expect(timeseries).toHaveLength(30);
    expect(timeseries.at(-1).views).toBeGreaterThanOrEqual(3);
    expect(previousTotals).toHaveProperty('views');
  });

  it('breaks traffic down by dimension', async () => {
    const breakdown = async (dimension: string) =>
      (await api().get(url('/analytics/breakdown')).set(auth).query({ dimension, limit: 100 })).body
        .data;

    const pages = await breakdown('pages');
    expect(pages).toContainEqual({ label: `${base}/pricing`, views: 1, visitors: 1 });

    const labels = async (dimension: string) =>
      (await breakdown(dimension)).map((row: { label: string }) => row.label);
    expect(await labels('referrers')).toEqual(expect.arrayContaining(['google.com', 'Direct']));
    expect(await labels('devices')).toEqual(expect.arrayContaining(['desktop', 'mobile']));
    expect(await labels('events')).toContain('cv_download');

    const invalid = await api()
      .get(url('/analytics/breakdown'))
      .set(auth)
      .query({ dimension: 'passwords' });
    expect(invalid.status).toBe(422);
  });

  it('shows who is on the site right now', async () => {
    const res = await api().get(url('/analytics/realtime')).set(auth);
    expect(res.body.data.activeVisitors).toBeGreaterThanOrEqual(2);
  });

  it('reports Google Analytics as not connected when no property is configured', async () => {
    const res = await api().get(url('/analytics/ga4')).set(auth);
    expect(res.body.data).toEqual({ configured: false });
  });
});

describe('dashboard and audit trail', () => {
  it('summarises the site for the admin home screen', async () => {
    expect((await api().get(url('/dashboard'))).status).toBe(401);

    const res = await api().get(url('/dashboard')).set(auth);
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.data.counts).sort()).toEqual(
      [
        'draftPosts',
        'pendingBookings',
        'posts',
        'projects',
        'services',
        'subscribers',
        'unreadMessages',
      ].sort(),
    );
    expect(res.body.data.analytics.totals.views).toBeGreaterThanOrEqual(3);
  });

  it('records who changed what, but not failed or anonymous requests', async () => {
    const created = await api()
      .post(url('/tags'))
      .set(auth)
      .send({ name: unique('audit') });
    await api().post(url('/tags')).set(auth).send({ name: '' }).expect(422);
    await api().post(url('/contact')).send({ name: 'Jo', email: 'x' }).expect(422);

    // The trail is written after the response has been sent.
    await new Promise((resolve) => setTimeout(resolve, 200));

    const res = await api().get(url('/audit-logs')).set(auth).query({ userId: adminId });
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      action: 'CREATE',
      entity: 'tags',
      user: { id: adminId },
    });

    await api()
      .delete(url(`/tags/${created.body.data.id}`))
      .set(auth)
      .expect(200);
    await new Promise((resolve) => setTimeout(resolve, 200));
  });
});
