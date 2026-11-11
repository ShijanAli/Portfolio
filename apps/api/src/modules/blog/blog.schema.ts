import { z } from 'zod';
import {
  booleanQuerySchema,
  idSchema,
  optionalAssetUrl,
  optionalText,
  richTextSchema,
  slugSchema,
  toUpdateSchema,
} from '@/common/schemas/common.schema';
import { paginationSchema } from '@/common/schemas/pagination.schema';
import { seoSchema } from '@/common/schemas/seo.schema';

export const postStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']);

const postFields = z.object({
  title: z.string().trim().min(3).max(150),
  /** Generated from the title when omitted. */
  slug: slugSchema.optional(),
  excerpt: optionalText(300),
  content: richTextSchema.pipe(z.string().min(1, 'Content is required')),
  coverImage: optionalAssetUrl,
  status: postStatusSchema.default('DRAFT'),
  /** Required for SCHEDULED. Defaults to "now" when a post is first published. */
  publishedAt: z.coerce.date().optional(),
  isFeatured: z.boolean().default(false),
  categoryId: idSchema.nullable().optional(),
  tagIds: z.array(idSchema).max(15).default([]),
  seo: seoSchema.optional(),
});

function refineSchedule(data: { status?: string; publishedAt?: Date }, ctx: z.RefinementCtx) {
  if (data.status !== 'SCHEDULED') return;
  if (!data.publishedAt || data.publishedAt <= new Date()) {
    ctx.addIssue({
      code: 'custom',
      path: ['publishedAt'],
      message: 'A scheduled post needs a publish date in the future',
    });
  }
}

export const createPostSchema = postFields.superRefine(refineSchedule);
export const updatePostSchema = toUpdateSchema(postFields).superRefine(refineSchedule);

export const postQuerySchema = paginationSchema.extend({
  status: postStatusSchema.optional(),
  isFeatured: booleanQuerySchema.optional(),
  /** Category slug. */
  category: z.string().trim().max(160).optional(),
  /** Tag slug. */
  tag: z.string().trim().max(160).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
