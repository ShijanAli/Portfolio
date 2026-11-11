import { z } from 'zod';
import { seoSchema } from '@/common/schemas/seo.schema';

/** Static pages of the website that have their own SEO record. */
export const PAGE_KEYS = [
  'home',
  'about',
  'projects',
  'services',
  'blog',
  'experience',
  'contact',
  'book',
] as const;

export const pageKeyParamSchema = z.object({ pageKey: z.enum(PAGE_KEYS) });

export const upsertPageSeoSchema = seoSchema;

export type PageKey = (typeof PAGE_KEYS)[number];
export type UpsertPageSeoInput = z.infer<typeof upsertPageSeoSchema>;
