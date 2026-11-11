import { z } from 'zod';
import { optionalText } from '@/common/schemas/common.schema';
import { paginationSchema } from '@/common/schemas/pagination.schema';
import { topicsSchema } from '@/modules/newsletter/newsletter.schema';

export const subscriberStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'UNSUBSCRIBED', 'BOUNCED']);

/**
 * An admin can correct details or stop sending to an address, but cannot mark someone as
 * CONFIRMED: consent only ever comes from the subscriber clicking the confirmation link.
 */
export const updateSubscriberSchema = z.object({
  name: optionalText(100),
  topics: topicsSchema.optional(),
  status: subscriberStatusSchema.extract(['UNSUBSCRIBED', 'BOUNCED']).optional(),
});

export const subscriberQuerySchema = paginationSchema.extend({
  status: subscriberStatusSchema.optional(),
  source: z.string().trim().max(40).optional(),
});

export type UpdateSubscriberInput = z.infer<typeof updateSubscriberSchema>;
