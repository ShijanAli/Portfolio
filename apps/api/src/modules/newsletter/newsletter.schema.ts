import { z } from 'zod';
import { emailSchema, honeypotSchema, optionalText } from '@/common/schemas/common.schema';

/** Topics a subscriber can choose. No topics selected means "everything". */
export const NEWSLETTER_TOPICS = ['blog', 'projects', 'offers'] as const;

export const topicsSchema = z
  .array(z.enum(NEWSLETTER_TOPICS))
  .max(NEWSLETTER_TOPICS.length)
  .transform((topics) => [...new Set(topics)]);

export const subscribeSchema = z.object({
  email: emailSchema,
  name: optionalText(100),
  /** Where the form was shown: footer, section, blog... */
  source: optionalText(40),
  topics: topicsSchema.default([]),
  website: honeypotSchema,
});

const tokenSchema = z.string().min(20).max(128);

/** Tokens arrive in the body (website forms) or the query (one-click links in mail clients). */
export const tokenBodySchema = z.object({ token: tokenSchema });
export const tokenQuerySchema = z.object({ token: tokenSchema.optional() });

export const updatePreferencesSchema = z.object({
  token: tokenSchema,
  name: optionalText(100),
  topics: topicsSchema,
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
