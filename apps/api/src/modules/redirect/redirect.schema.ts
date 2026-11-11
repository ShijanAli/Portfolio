import { z } from 'zod';
import { booleanQuerySchema, toUpdateSchema, urlSchema } from '@/common/schemas/common.schema';
import { paginationSchema } from '@/common/schemas/pagination.schema';

const pathSchema = z
  .string()
  .trim()
  .max(500)
  .regex(/^\/[^\s]*$/, 'Must start with "/" and contain no spaces');

const redirectFields = z.object({
  fromPath: pathSchema,
  /** A path on this site or an absolute URL. */
  toPath: z.union([pathSchema, urlSchema]),
  statusCode: z
    .union([z.literal(301), z.literal(302), z.literal(307), z.literal(308)])
    .default(301),
  isActive: z.boolean().default(true),
});

function refineLoop(data: { fromPath?: string; toPath?: string }, ctx: z.RefinementCtx) {
  if (data.fromPath && data.fromPath === data.toPath) {
    ctx.addIssue({ code: 'custom', path: ['toPath'], message: 'A path cannot redirect to itself' });
  }
}

export const createRedirectSchema = redirectFields.superRefine(refineLoop);
export const updateRedirectSchema = toUpdateSchema(redirectFields).superRefine(refineLoop);

export const redirectQuerySchema = paginationSchema.extend({
  isActive: booleanQuerySchema.optional(),
});

export type CreateRedirectInput = z.infer<typeof createRedirectSchema>;
export type UpdateRedirectInput = z.infer<typeof updateRedirectSchema>;
