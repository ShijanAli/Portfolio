import { z } from 'zod';
import { idSchema } from '@/common/schemas/common.schema';
import { dateOnlySchema, timezoneSchema } from '@/common/schemas/time.schema';

// ----- Collector (public) -----

/** Only the path is kept: query strings can contain personal data. */
const pathSchema = z
  .string()
  .max(2000)
  .transform((value) => value.split(/[?#]/)[0] ?? '')
  .pipe(
    z
      .string()
      .regex(/^\/[^\s]*$/)
      .max(500),
  );

const campaignTag = z.string().trim().max(100).optional();

const pageViewSchema = z.object({
  type: z.literal('pageview'),
  path: pathSchema,
  title: z.string().trim().max(200).optional(),
  referrer: z.string().max(2000).optional(),
  utmSource: campaignTag,
  utmMedium: campaignTag,
  utmCampaign: campaignTag,
});

/** Sent when the visitor leaves a page, to record how long they stayed and how far they read. */
const leaveSchema = z.object({
  type: z.literal('leave'),
  pageViewId: idSchema,
  duration: z.number().int().min(0).max(86_400),
  scrollDepth: z.number().int().min(0).max(100),
});

const eventSchema = z.object({
  type: z.literal('event'),
  /** e.g. cv_download, project_click, booking_completed */
  name: z.string().regex(/^[a-z][a-z0-9_]{1,49}$/, 'Use snake_case'),
  path: pathSchema.optional(),
  properties: z
    .record(z.string().max(50), z.union([z.string().max(200), z.number(), z.boolean()]))
    .refine((value) => Object.keys(value).length <= 20, 'Too many properties')
    .optional(),
});

export const collectSchema = z.discriminatedUnion('type', [
  pageViewSchema,
  leaveSchema,
  eventSchema,
]);

// ----- Reports (admin) -----

const MAX_RANGE_DAYS = 366;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Calendar dates, both inclusive, interpreted in `timezone`. Defaults to the last 30 days. */
export const rangeQuerySchema = z
  .object({
    from: dateOnlySchema.optional(),
    to: dateOnlySchema.optional(),
    timezone: timezoneSchema.default('UTC'),
  })
  .refine((range) => !range.from || !range.to || range.to >= range.from, {
    path: ['to'],
    message: 'Must not be before "from"',
  })
  .refine(
    (range) =>
      !range.from ||
      !range.to ||
      Date.parse(range.to) - Date.parse(range.from) <= MAX_RANGE_DAYS * DAY_MS,
    { path: ['to'], message: `Range can be at most ${MAX_RANGE_DAYS} days` },
  );

export const DIMENSIONS = [
  'pages',
  'referrers',
  'sources',
  'countries',
  'devices',
  'browsers',
  'systems',
  'events',
] as const;

export const breakdownQuerySchema = rangeQuerySchema.safeExtend({
  dimension: z.enum(DIMENSIONS),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CollectInput = z.infer<typeof collectSchema>;
export type RangeQuery = z.infer<typeof rangeQuerySchema>;
export type BreakdownQuery = z.infer<typeof breakdownQuerySchema>;
export type Dimension = (typeof DIMENSIONS)[number];
