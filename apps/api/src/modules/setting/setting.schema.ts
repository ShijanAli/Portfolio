import { z } from 'zod';
import {
  optionalAssetUrl,
  optionalEmail,
  optionalText,
  optionalUrl,
  stringListSchema,
} from '@/common/schemas/common.schema';

/**
 * Site settings are stored as one JSON document per key. Every field is optional or has a
 * default, so parsing an empty object yields a complete, valid setting: nothing needs to
 * be seeded and new fields never break existing data.
 *
 * Everything here is public (the website reads it). Secrets belong in environment
 * variables, never in settings.
 */

const linkSchema = z.object({
  label: z.string().trim().max(40).default(''),
  href: z.string().trim().max(2048).default(''),
});

const SECTION_KEYS = [
  'hero',
  'about',
  'services',
  'projects',
  'experience',
  'techStack',
  'blog',
  'testimonials',
  'newsletter',
  'booking',
  'contact',
] as const;

const sectionSchema = z.object({
  key: z.enum(SECTION_KEYS),
  enabled: z.boolean().default(true),
});

export const settingSchemas = {
  general: z.object({
    siteName: z.string().trim().max(60).default('Portfolio'),
    ownerName: z.string().trim().max(80).default(''),
    tagline: z.string().trim().max(160).default(''),
    bio: z.string().trim().max(2000).default(''),
    logo: optionalAssetUrl,
    favicon: optionalAssetUrl,
    avatar: optionalAssetUrl,
    email: optionalEmail,
    phone: optionalText(30),
    location: optionalText(120),
    resumeUrl: optionalAssetUrl,
    availableForWork: z.boolean().default(true),
  }),

  hero: z.object({
    greeting: z.string().trim().max(60).default("Hi, I'm"),
    headline: z.string().trim().max(120).default(''),
    subheadline: z.string().trim().max(300).default(''),
    /** Rotating role titles, e.g. "Full Stack Developer". */
    roles: stringListSchema(8, 60),
    image: optionalAssetUrl,
    primaryCta: linkSchema.default({ label: 'Book a call', href: '/book' }),
    secondaryCta: linkSchema.default({ label: 'View projects', href: '/projects' }),
  }),

  socials: z.object({
    github: optionalUrl,
    linkedin: optionalUrl,
    twitter: optionalUrl,
    facebook: optionalUrl,
    youtube: optionalUrl,
    whatsapp: optionalUrl,
    upwork: optionalUrl,
    fiverr: optionalUrl,
  }),

  theme: z.object({
    accentColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex color like #7c5cff')
      .default('#7c5cff'),
    defaultMode: z.enum(['dark', 'light', 'system']).default('dark'),
  }),

  /** Home page sections; array order is display order. */
  sections: z.object({
    items: z
      .array(sectionSchema)
      .max(SECTION_KEYS.length)
      .refine((items) => new Set(items.map((item) => item.key)).size === items.length, {
        message: 'Each section can only appear once',
      })
      .default(SECTION_KEYS.map((key) => ({ key, enabled: true }))),
  }),

  /** Site-wide SEO defaults. Per-page and per-item SEO lives in the Seo table. */
  seo: z.object({
    siteUrl: optionalUrl,
    titleTemplate: z.string().trim().max(80).default('%s | Portfolio'),
    defaultTitle: z.string().trim().max(70).default('Portfolio'),
    defaultDescription: z.string().trim().max(170).default(''),
    keywords: stringListSchema(30, 50),
    ogImage: optionalAssetUrl,
    twitterHandle: optionalText(30),
    googleSiteVerification: optionalText(100),
  }),

  integrations: z.object({
    gaMeasurementId: z
      .union([z.literal('').transform(() => undefined), z.string().regex(/^G-[A-Z0-9]+$/)])
      .optional(),
    turnstileSiteKey: optionalText(100),
  }),
} as const;

export type SettingKey = keyof typeof settingSchemas;
export type SettingValue<K extends SettingKey> = z.infer<(typeof settingSchemas)[K]>;
export type AllSettings = { [K in SettingKey]: SettingValue<K> };

export const SETTING_KEYS = Object.keys(settingSchemas) as SettingKey[];

export const settingKeyParamSchema = z.object({
  key: z.enum(SETTING_KEYS as [SettingKey, ...SettingKey[]]),
});
