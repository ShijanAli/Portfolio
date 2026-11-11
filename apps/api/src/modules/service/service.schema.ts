import { z } from 'zod';
import {
  contentStatusSchema,
  optionalAssetUrl,
  optionalText,
  orderSchema,
  richTextSchema,
  slugSchema,
  stringListSchema,
  toUpdateSchema,
} from '@/common/schemas/common.schema';
import { paginationSchema } from '@/common/schemas/pagination.schema';
import { seoSchema } from '@/common/schemas/seo.schema';

const faqSchema = z.object({
  question: z.string().trim().min(5).max(300),
  answer: z.string().trim().min(5).max(2000),
});

export const createServiceSchema = z.object({
  title: z.string().trim().min(3).max(120),
  /** Generated from the title when omitted. */
  slug: slugSchema.optional(),
  shortDesc: z.string().trim().min(10).max(300),
  content: richTextSchema.optional(),
  icon: optionalText(2048),
  coverImage: optionalAssetUrl,
  features: stringListSchema(20, 200),
  startingPrice: z.number().nonnegative().max(1_000_000).nullable().optional(),
  currency: z
    .string()
    .trim()
    .length(3)
    .transform((value) => value.toUpperCase())
    .default('USD'),
  order: orderSchema.default(0),
  status: contentStatusSchema.default('DRAFT'),
  /** Sent as a whole list; the order of the array is the display order. */
  faqs: z.array(faqSchema).max(30).default([]),
  seo: seoSchema.optional(),
});

export const updateServiceSchema = toUpdateSchema(createServiceSchema);

export const serviceQuerySchema = paginationSchema.extend({
  status: contentStatusSchema.optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
