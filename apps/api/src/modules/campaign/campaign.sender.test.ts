import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { testOutbox } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';
import { unique } from '@/tests/helpers';
import { deliverBatch, queueRecipients } from './campaign.sender';

const tag = unique('sender');
const subject = `Delivery ${tag}`;
const RECIPIENTS = 12;

beforeAll(async () => {
  await prisma.subscriber.createMany({
    data: Array.from({ length: RECIPIENTS }, (_, index) => ({
      email: `${tag}-${index}@example.com`,
      status: 'CONFIRMED' as const,
      unsubscribeToken: `${tag}-token-${index}`,
    })),
  });
});

afterAll(async () => {
  await prisma.campaign.deleteMany({ where: { subject } });
  await prisma.subscriber.deleteMany({ where: { email: { startsWith: tag } } });
  await prisma.$disconnect();
});

describe('campaign delivery', () => {
  it('emails each subscriber once even when several workers deliver at the same time', async () => {
    const campaign = await prisma.campaign.create({
      data: { subject, content: '<p>Hello</p>', status: 'SENDING', topics: [] },
    });
    // Only this test's subscribers, so the count below is exact.
    await prisma.campaignRecipient.createMany({
      data: (await prisma.subscriber.findMany({ where: { email: { startsWith: tag } } })).map(
        ({ id }) => ({ campaignId: campaign.id, subscriberId: id }),
      ),
    });
    expect(queueRecipients).toBeTypeOf('function');

    // Three workers read the same queued rows: as with two serverless instances.
    await Promise.all([deliverBatch(campaign), deliverBatch(campaign), deliverBatch(campaign)]);

    const sent = testOutbox.filter((message) => message.subject === subject);
    expect(sent).toHaveLength(RECIPIENTS);
    expect(new Set(sent.map((message) => message.to.email)).size).toBe(RECIPIENTS);
    expect(
      await prisma.campaignRecipient.count({ where: { campaignId: campaign.id, status: 'SENT' } }),
    ).toBe(RECIPIENTS);
  });
});
