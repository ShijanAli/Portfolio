import { z } from 'zod';
import {
  assetUrlSchema,
  booleanQuerySchema,
  contentStatusSchema,
  idSchema,
  optionalAssetUrl,
  optionalText,
  optionalUrl,
  orderSchema,
  refineDateRange,
  richTextSchema,
  slugSchema,
  toUpdateSchema,
} from '@/common/schemas/common.schema';
import { paginationSchema } from '@/common/schemas/pagination.schema';
import { seoSchema } from '@/common/schemas/seo.schema';

const projectFields = z.object({
  title: z.string().trim().min(3).max(150),
  /** Generated from the title when omitted. */
  slug: slugSchema.optional(),
  summary: z.string().trim().min(10).max(300),
  content: richTextSchema.optional(),
  coverImage: optionalAssetUrl,
  gallery: z.array(assetUrlSchema).max(20).default([]),
  liveUrl: optionalUrl,
  githubUrl: optionalUrl,
  role: optionalText(100),
  client: optionalText(100),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  isFeatured: z.boolean().default(false),
  order: orderSchema.default(0),
  status: contentStatusSchema.default('DRAFT'),
  categoryId: idSchema.nullable().optional(),
  technologyIds: z.array(idSchema).max(30).default([]),
  seo: seoSchema.optional(),
});

export const createProjectSchema = projectFields.superRefine(refineDateRange);
export const updateProjectSchema = toUpdateSchema(projectFields).superRefine(refineDateRange);

export const projectQuerySchema = paginationSchema.extend({
  status: contentStatusSchema.optional(),
  isFeatured: booleanQuerySchema.optional(),
  /** Category slug. */
  category: z.string().trim().max(160).optional(),
  /** Technology slug. */
  technology: z.string().trim().max(160).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
