import { z } from 'zod';
import {
  emailSchema,
  optionalText,
  richTextSchema,
  toUpdateSchema,
} from '@/common/schemas/common.schema';
import { paginationSchema } from '@/common/schemas/pagination.schema';
import { topicsSchema } from '@/modules/newsletter/newsletter.schema';

export const campaignStatusSchema = z.enum(['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED']);

const campaignFields = z.object({
  subject: z.string().trim().min(3).max(150),
  /** Preview text shown next to the subject in the inbox. */
  preheader: optionalText(150),
  content: richTextSchema.pipe(z.string().min(1, 'Content is required')),
  /** Send only to subscribers interested in these topics. Empty = everyone. */
  topics: topicsSchema.default([]),
  /** Sending itself is a separate action; here a campaign is only drafted or scheduled. */
  status: campaignStatusSchema.extract(['DRAFT', 'SCHEDULED']).default('DRAFT'),
  scheduledAt: z.coerce.date().nullable().optional(),
});

function refineSchedule(
  data: { status?: string; scheduledAt?: Date | null },
  ctx: z.RefinementCtx,
) {
  if (data.status !== 'SCHEDULED') return;
  if (!data.scheduledAt || data.scheduledAt <= new Date()) {
    ctx.addIssue({
      code: 'custom',
      path: ['scheduledAt'],
      message: 'A scheduled campaign needs a send date in the future',
    });
  }
}

export const createCampaignSchema = campaignFields.superRefine(refineSchedule);
export const updateCampaignSchema = toUpdateSchema(campaignFields).superRefine(refineSchedule);

export const campaignQuerySchema = paginationSchema.extend({
  status: campaignStatusSchema.optional(),
});

export const testCampaignSchema = z.object({ email: emailSchema });

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
