import { deliverCampaignInBackground } from '@/modules/campaign/campaign.sender';
import { campaignService } from '@/modules/campaign/campaign.service';
import { prisma } from '@/lib/prisma';

/** Starts scheduled campaigns that are due, and resumes deliveries cut short by a restart. */
export async function processCampaigns(): Promise<void> {
  const due = await prisma.campaign.findMany({
    where: { status: 'SCHEDULED', scheduledAt: { lte: new Date() } },
    select: { id: true },
  });
  for (const { id } of due) await campaignService.send(id);

  const interrupted = await prisma.campaign.findMany({
    where: { status: 'SENDING' },
    select: { id: true },
  });
  for (const { id } of interrupted) deliverCampaignInBackground(id);
}
