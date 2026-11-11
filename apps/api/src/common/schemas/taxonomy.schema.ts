import { z } from 'zod';
import { slugSchema } from './common.schema';

/** Shared by every "name + slug" lookup resource: categories, tags... */
export const taxonomyFields = z.object({
  name: z.string().trim().min(2).max(60),
  /** Generated from the name when omitted. */
  slug: slugSchema.optional(),
});
