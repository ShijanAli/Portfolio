import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { testOutbox } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';
import { api, createTestAdmin, unique, url } from '@/tests/helpers';

let auth: { Authorization: string };
let adminId: string;
const tag = unique('nl');
const blogReader = `${tag}-blog@example.com`;
const offersOnly = `${tag}-offers@example.com`;
const neverConfirmed = `${tag}-pending@example.com`;

const subscribe = (email: string, topics: string[] = []) =>
  api().post(url('/newsletter/subscribe')).send({ email, topics, source: 'test' });

const emailsTo = (address: string) => testOutbox.filter((message) => message.to.email === address);
const tokenIn = (html: string, page: string) =>
  decodeURIComponent(new RegExp(`/newsletter/${page}\\?token=([^"&]+)`).exec(html)?.[1] ?? '');

async function subscribeAndConfirm(email: string, topics: string[] = []) {
  await subscribe(email, topics);
  const token = tokenIn(emailsTo(email).at(-1)!.html, 'confirm');
  await api().post(url('/newsletter/confirm')).send({ token }).expect(200);
}

const waitUntilSent = async (id: string) => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id } });
    if (campaign.status !== 'SENDING') return campaign.status;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return 'TIMEOUT';
};

beforeAll(async () => {
  const admin = await createTestAdmin();
  auth = admin.auth;
  adminId = admin.user.id;
});

afterAll(async () => {
  await prisma.campaign.deleteMany({ where: { subject: { contains: tag } } });
  await prisma.subscriber.deleteMany({ where: { email: { startsWith: tag } } });
  await prisma.user.delete({ where: { id: adminId } });
  await prisma.$disconnect();
});

describe('newsletter subscription', () => {
  it('does not subscribe anyone until they confirm by email', async () => {
    const res = await subscribe(blogReader, ['blog']);
    expect(res.status).toBe(200);

    const stored = await prisma.subscriber.findUniqueOrThrow({ where: { email: blogReader } });
    expect(stored.status).toBe('PENDING');
    expect(emailsTo(blogReader)[0]?.subject).toBe('Please confirm your subscription');
  });

  it('confirms with the emailed link, once', async () => {
    const token = tokenIn(emailsTo(blogReader)[0]!.html, 'confirm');

    await api().post(url('/newsletter/confirm')).send({ token }).expect(200);
    const stored = await prisma.subscriber.findUniqueOrThrow({ where: { email: blogReader } });
    expect(stored.status).toBe('CONFIRMED');
    expect(emailsTo(blogReader).at(-1)?.subject).toBe('You are subscribed');

    expect((await api().post(url('/newsletter/confirm')).send({ token })).status).toBe(400);
  });

  it('answers the same for a known address and sends it nothing new', async () => {
    const before = emailsTo(blogReader).length;
    const res = await subscribe(blogReader);

    expect(res.status).toBe(200);
    expect(emailsTo(blogReader)).toHaveLength(before);
  });

  it('drops bot submissions and validates the email', async () => {
    const bot = `${tag}-bot@example.com`;
    await api().post(url('/newsletter/subscribe')).send({ email: bot, website: 'x' }).expect(200);
    expect(await prisma.subscriber.count({ where: { email: bot } })).toBe(0);

    expect((await subscribe('not-an-email')).status).toBe(422);
  });

  it('lets a subscriber change topics with their token', async () => {
    const token = tokenIn(emailsTo(blogReader).at(-1)!.html, 'preferences');
    const res = await api()
      .put(url('/newsletter/preferences'))
      .send({ token, topics: ['blog', 'projects', 'blog'] });

    expect(res.body.data.topics).toEqual(['blog', 'projects']);
    expect(
      (
        await api()
          .get(url('/newsletter/preferences'))
          .query({ token: 'x'.repeat(30) })
      ).status,
    ).toBe(400);
  });
});

describe('campaigns', () => {
  let campaignId: string;

  beforeAll(async () => {
    await subscribeAndConfirm(offersOnly, ['offers']);
    await subscribe(neverConfirmed);
  });

  it('is admin only', async () => {
    expect((await api().get(url('/campaigns'))).status).toBe(401);
    expect((await api().get(url('/subscribers'))).status).toBe(401);
  });

  it('creates a draft with sanitized content and reports its audience', async () => {
    const res = await api()
      .post(url('/campaigns'))
      .set(auth)
      .send({
        subject: `New post ${tag}`,
        content: '<p>Read it <a href="https://example.com/post" onclick="x()">here</a></p>',
        topics: ['blog'],
      });

    expect(res.status).toBe(201);
    campaignId = res.body.data.id;
    expect(res.body.data.content).not.toContain('onclick');

    const stats = await api()
      .get(url(`/campaigns/${campaignId}/stats`))
      .set(auth);
    expect(stats.body.data.status).toBe('DRAFT');
  });

  it('sends only to confirmed subscribers interested in the topic, with unsubscribe headers', async () => {
    const res = await api()
      .post(url(`/campaigns/${campaignId}/send`))
      .set(auth);
    expect(res.status).toBe(200);
    expect(await waitUntilSent(campaignId)).toBe('SENT');

    const subject = `New post ${tag}`;
    const received = (address: string) => emailsTo(address).filter((m) => m.subject === subject);

    expect(received(blogReader)).toHaveLength(1);
    expect(received(offersOnly)).toHaveLength(0);
    expect(received(neverConfirmed)).toHaveLength(0);
    expect(received(blogReader)[0]?.headers?.['List-Unsubscribe-Post']).toBe(
      'List-Unsubscribe=One-Click',
    );
  });

  it('cannot be sent or edited a second time', async () => {
    expect(
      (
        await api()
          .post(url(`/campaigns/${campaignId}/send`))
          .set(auth)
      ).status,
    ).toBe(409);

    const edit = await api()
      .patch(url(`/campaigns/${campaignId}`))
      .set(auth)
      .send({ subject: 'Changed' });
    expect(edit.status).toBe(409);
  });

  it('one-click unsubscribe works from the mail client and hides tokens from the admin list', async () => {
    const message = emailsTo(blogReader).at(-1)!;
    const link = /<([^>]+)>/.exec(message.headers!['List-Unsubscribe']!)![1]!;

    await api()
      .post(new URL(link).pathname + new URL(link).search)
      .type('form')
      .send('List-Unsubscribe=One-Click')
      .expect(200);

    const list = await api().get(url('/subscribers')).set(auth).query({ search: blogReader });
    expect(list.body.data[0].status).toBe('UNSUBSCRIBED');
    expect(list.body.data[0]).not.toHaveProperty('unsubscribeToken');
  });

  it('exports subscribers as CSV', async () => {
    const res = await api().get(url('/subscribers/export')).set(auth);

    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain(blogReader);
  });
});
