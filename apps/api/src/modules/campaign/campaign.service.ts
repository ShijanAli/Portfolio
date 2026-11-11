import type { Campaign, CampaignStatus, RecipientStatus } from '@prisma/client';
import { BaseService } from '@/common/base/base.service';
import { ApiError } from '@/common/utils/api-error';
import { campaignEmail } from '@/emails/newsletter.emails';
import { sendEmail } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';
import type { CreateCampaignInput, UpdateCampaignInput } from './campaign.schema';
import { audienceFor, deliverCampaignInBackground, queueRecipients } from './campaign.sender';

/** Only campaigns that have not started sending can be changed, sent or deleted. */
const EDITABLE: CampaignStatus[] = ['DRAFT', 'SCHEDULED'];
const RECIPIENT_STATUSES: RecipientStatus[] = ['QUEUED', 'SENT', 'FAILED', 'BOUNCED'];

class CampaignService extends BaseService<Campaign, CreateCampaignInput, UpdateCampaignInput> {
  constructor() {
    super(prisma.campaign, {
      resource: 'Campaign',
      listOmit: { content: true },
      searchFields: ['subject'],
      filterFields: ['status'],
      sortFields: ['subject', 'scheduledAt', 'sentAt', 'createdAt'],
      defaultSort: { field: 'createdAt', order: 'desc' },
    });
  }

  override async update(id: string, input: UpdateCampaignInput): Promise<Campaign> {
    await this.getEditable(id);
    return super.update(id, input);
  }

  override async remove(id: string): Promise<void> {
    const campaign = await this.getById(id);
    if (campaign.status === 'SENDING') {
      throw ApiError.conflict('A campaign cannot be deleted while it is sending');
    }
    await super.remove(id);
  }

  /** Delivery progress, plus how many people the campaign would reach if sent now. */
  async getStats(id: string) {
    const campaign = await this.getById(id);
    const [groups, audience] = await Promise.all([
      prisma.campaignRecipient.groupBy({ by: ['status'], where: { campaignId: id }, _count: true }),
      prisma.subscriber.count({ where: audienceFor(campaign) }),
    ]);

    const recipients = Object.fromEntries(
      RECIPIENT_STATUSES.map((status) => [status, 0]),
    ) as Record<RecipientStatus, number>;
    for (const group of groups) recipients[group.status] = group._count;

    return { status: campaign.status, audience, recipients };
  }

  /** Sends the campaign to one address so it can be checked in a real inbox. */
  async sendTest(id: string, email: string): Promise<void> {
    const campaign = await this.getById(id);
    await sendEmail(
      campaignEmail(
        { ...campaign, subject: `[Test] ${campaign.subject}` },
        { email, name: null, unsubscribeToken: 'test-email-no-subscription' },
      ),
    );
  }

  /**
   * Starts delivery. The status change is a single conditional update, so two clicks on
   * "Send" (or the scheduler firing at the same moment) can only start one delivery.
   */
  async send(id: string): Promise<{ recipients: number }> {
    const claimed = await prisma.campaign.updateMany({
      where: { id, status: { in: EDITABLE } },
      data: { status: 'SENDING' },
    });
    if (claimed.count === 0) {
      const current = await this.getById(id);
      throw ApiError.conflict(`A campaign that is ${current.status} cannot be sent again`);
    }

    const campaign = await this.getById(id);
    const recipients = await queueRecipients(campaign);
    deliverCampaignInBackground(id);
    return { recipients };
  }

  private async getEditable(id: string): Promise<Campaign> {
    const campaign = await this.getById(id);
    if (!EDITABLE.includes(campaign.status)) {
      throw ApiError.conflict(`A campaign that is ${campaign.status} can no longer be changed`);
    }
    return campaign;
  }
}

export const campaignService = new CampaignService();
