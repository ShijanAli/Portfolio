import { z } from 'zod';
import { optionalAssetUrl, optionalText, optionalUrl } from './common.schema';

/** Embedded in every content schema that owns a Seo record (project, service, post). */
export const seoSchema = z.object({
  metaTitle: optionalText(70),
  metaDescription: optionalText(170),
  keywords: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  ogTitle: optionalText(100),
  ogDescription: optionalText(200),
  ogImage: optionalAssetUrl,
  canonicalUrl: optionalUrl,
  noIndex: z.boolean().default(false),
});

export type SeoInput = z.infer<typeof seoSchema>;
