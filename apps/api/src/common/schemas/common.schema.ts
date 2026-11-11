import { z } from 'zod';
import { sanitizeRichText } from '@/common/utils/sanitize';

/** Reusable Zod building blocks. Module schemas compose these instead of redefining them. */

export const emailSchema = z
  .email('Please enter a valid email address')
  .trim()
  .toLowerCase()
  .max(254);

export const urlSchema = z.url().max(2048);

/** Absolute URL or a root-relative path such as "/uploads/a.png". */
export const assetUrlSchema = z.union([
  urlSchema,
  z
    .string()
    .regex(/^\/[^\s]*$/)
    .max(2048),
]);

export const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only');

export const orderSchema = z.number().int().min(0).max(100_000);

/** Query strings arrive as text, so "true"/"false" must be converted explicitly. */
export const booleanQuerySchema = z.enum(['true', 'false']).transform((value) => value === 'true');

/**
 * Optional text. An empty string or null from a form means "clear this field", which is
 * stored as null. Leaving the key out of a PATCH leaves the field untouched.
 */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((value) => value || null)
    .optional();

/** Shared rule for anything with a start/end date and an "ongoing" flag. */
export function refineDateRange<T extends { startDate?: Date | null; endDate?: Date | null }>(
  data: T,
  ctx: z.RefinementCtx,
) {
  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    ctx.addIssue({
      code: 'custom',
      path: ['endDate'],
      message: 'End date must be after start date',
    });
  }
}

/**
 * Builds the PATCH schema from a create schema: every field optional and defaults removed.
 * Plain `.partial()` is not enough because Zod still applies `.default()` to missing keys,
 * which would silently reset fields the client never sent.
 */
export function toUpdateSchema<S extends z.ZodRawShape>(schema: z.ZodObject<S>) {
  const shape = Object.fromEntries(
    Object.entries(schema.shape).map(([key, field]) => [
      key,
      field instanceof z.ZodDefault ? field.unwrap() : field,
    ]),
  );
  return z.object(shape).partial() as unknown as z.ZodObject<{
    [K in keyof S]: z.ZodOptional<S[K]>;
  }>;
}

export const idSchema = z.string().trim().min(1).max(64);

export const contentStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

/** Editor HTML, sanitized on the way in. */
export const richTextSchema = z.string().max(200_000).transform(sanitizeRichText);

export const stringListSchema = (maxItems: number, maxLength: number) =>
  z.array(z.string().trim().min(1).max(maxLength)).max(maxItems).default([]);

/** What visitors may see of anything that uses ContentStatus. */
export const PUBLISHED_SCOPE = { status: 'PUBLISHED' } as const;

/** Optional URL fields: an empty string or null clears the value (stored as null). */
const clearable = <T extends z.ZodType>(schema: T) =>
  z.union([z.literal('').transform(() => null), z.null(), schema]).optional();

export const optionalUrl = clearable(urlSchema);
export const optionalAssetUrl = clearable(assetUrlSchema);
export const optionalEmail = clearable(emailSchema);

/**
 * Honeypot for public forms: the field is hidden from people, so only bots fill it in.
 * A filled honeypot gets a normal success response, but nothing is stored or sent.
 */
export const honeypotSchema = z.string().max(200).optional();

export const isHoneypotFilled = (body: { website?: string }) => Boolean(body.website);
