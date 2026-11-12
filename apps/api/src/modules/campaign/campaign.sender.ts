import type { Campaign, Prisma } from '@prisma/client';
import { campaignEmail } from '@/emails/newsletter.emails';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';
import { isServerless, runInBackground } from '@/lib/runtime';

/**
 * Campaign delivery. Progress lives in the CampaignRecipient table (QUEUED -> SENT/FAILED),
 * so a delivery interrupted by a restart continues where it stopped and nobody is emailed
 * twice.
 */

const BATCH_SIZE = 20;

/**
 * A serverless function is stopped at its time limit, in the middle of an email if need be.
 * So delivery pauses on its own a little before that and the next run continues.
 */
const DELIVERY_BUDGET_MS = isServerless ? 40_000 : Number.POSITIVE_INFINITY;

/** Campaigns being delivered by this process, so the scheduler does not start them twice. */
const inProgress = new Set<string>();

/** Confirmed subscribers who want this campaign. A subscriber with no topics gets everything. */
export function audienceFor(campaign: Pick<Campaign, 'topics'>): Prisma.SubscriberWhereInput {
  if (campaign.topics.length === 0) return { status: 'CONFIRMED' };
  return {
    status: 'CONFIRMED',
    OR: [{ topics: { isEmpty: true } }, { topics: { hasSome: campaign.topics } }],
  };
}

/** Fixes the recipient list at the moment sending starts. Returns how many were queued. */
export async function queueRecipients(campaign: Campaign): Promise<number> {
  const subscribers = await prisma.subscriber.findMany({
    where: audienceFor(campaign),
    select: { id: true },
  });

  const { count } = await prisma.campaignRecipient.createMany({
    data: subscribers.map(({ id }) => ({ campaignId: campaign.id, subscriberId: id })),
    skipDuplicates: true,
  });
  return count;
}

/** Exported for tests. */
export async function deliverBatch(campaign: Campaign): Promise<number> {
  const batch = await prisma.campaignRecipient.findMany({
    where: { campaignId: campaign.id, status: 'QUEUED' },
    include: { subscriber: true },
    take: BATCH_SIZE,
  });

  for (const recipient of batch) {
    // Someone may have unsubscribed after the campaign was queued.
    if (recipient.subscriber.status !== 'CONFIRMED') {
      await prisma.campaignRecipient.deleteMany({ where: { id: recipient.id, status: 'QUEUED' } });
      continue;
    }

    // Claim the recipient BEFORE sending, with one conditional update. Two workers (a
    // "Send now" and a scheduled run, or two serverless instances) can both have read this
    // row as QUEUED; only one of them wins the claim, so nobody is emailed twice.
    const claimed = await prisma.campaignRecipient.updateMany({
      where: { id: recipient.id, status: 'QUEUED' },
      data: { status: 'SENT', sentAt: new Date() },
    });
    if (claimed.count === 0) continue;

    try {
      await sendEmail(campaignEmail(campaign, recipient.subscriber));
    } catch (error) {
      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: { status: 'FAILED', sentAt: null, error: String(error).slice(0, 500) },
      });
    }
  }

  return batch.length;
}

/** Sends to every queued recipient, then marks the campaign as finished. */
export async function deliverCampaign(campaignId: string): Promise<void> {
  if (inProgress.has(campaignId)) return;
  inProgress.add(campaignId);

  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.status !== 'SENDING') return;

    const deadline = Date.now() + DELIVERY_BUDGET_MS;
    while ((await deliverBatch(campaign)) > 0) {
      // Keep going until no queued recipients are left, or the time budget is used up.
      if (Date.now() >= deadline) {
        // Stay in SENDING: the recipients still queued are picked up by the next scheduled run.
        logger.info({ campaignId }, 'Campaign delivery paused to stay within the time limit');
        return;
      }
    }

    const [sent, total] = await Promise.all([
      prisma.campaignRecipient.count({ where: { campaignId, status: 'SENT' } }),
      prisma.campaignRecipient.count({ where: { campaignId } }),
    ]);

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: total > 0 && sent === 0 ? 'FAILED' : 'SENT', sentAt: new Date() },
    });
    logger.info({ campaignId, sent, total }, 'Campaign delivered');
  } catch (error) {
    // The campaign stays in SENDING; the scheduler picks it up again.
    logger.error({ err: error, campaignId }, 'Campaign delivery interrupted');
  } finally {
    inProgress.delete(campaignId);
  }
}

export function deliverCampaignInBackground(campaignId: string): void {
  runInBackground(deliverCampaign(campaignId));
}
