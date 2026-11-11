import type { Campaign, Prisma } from '@prisma/client';
import { campaignEmail } from '@/emails/newsletter.emails';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';

/**
 * Campaign delivery. Progress lives in the CampaignRecipient table (QUEUED -> SENT/FAILED),
 * so a delivery interrupted by a restart continues where it stopped and nobody is emailed
 * twice.
 */

const BATCH_SIZE = 20;

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

async function deliverBatch(campaign: Campaign): Promise<number> {
  const batch = await prisma.campaignRecipient.findMany({
    where: { campaignId: campaign.id, status: 'QUEUED' },
    include: { subscriber: true },
    take: BATCH_SIZE,
  });

  for (const recipient of batch) {
    // Someone may have unsubscribed after the campaign was queued.
    if (recipient.subscriber.status !== 'CONFIRMED') {
      await prisma.campaignRecipient.delete({ where: { id: recipient.id } });
      continue;
    }

    try {
      await sendEmail(campaignEmail(campaign, recipient.subscriber));
      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } catch (error) {
      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: { status: 'FAILED', error: String(error).slice(0, 500) },
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

    while ((await deliverBatch(campaign)) > 0) {
      // Keep going until no queued recipients are left.
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
  void deliverCampaign(campaignId);
}
