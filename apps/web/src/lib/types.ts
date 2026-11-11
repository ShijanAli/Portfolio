import type { Serialized } from '@portfolio/api-client';
import type * as Api from '@portfolio/api/types';

/** The API's own model types, as they look after JSON serialization. */
export type Technology = Serialized<Api.Technology>;
export type Experience = Serialized<Api.Experience>;
export type Education = Serialized<Api.Education>;
export type Testimonial = Serialized<Api.Testimonial>;
export type Seo = Serialized<Api.Seo>;
export type ProjectCategory = Serialized<Api.ProjectCategory> & { _count: { projects: number } };
export type BlogCategory = Serialized<Api.BlogCategory> & { _count: { posts: number } };

export type Project = Serialized<Api.Project> & {
  category: Serialized<Api.ProjectCategory> | null;
  technologies: Technology[];
  seo: Seo | null;
};

export type Service = Serialized<Api.Service> & {
  faqs: Serialized<Api.ServiceFaq>[];
  seo: Seo | null;
};

export type Post = Serialized<Api.Post> & {
  author: { id: string; name: string; avatar: string | null };
  category: Serialized<Api.BlogCategory> | null;
  tags: Serialized<Api.Tag>[];
  seo: Seo | null;
};

interface Link {
  label: string;
  href: string;
}

export const SECTION_KEYS = [
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

export type SectionKey = (typeof SECTION_KEYS)[number];

/**
 * The response of `GET /settings`. The API validates and fills defaults for every field,
 * so nothing here is optional unless the API can return null for it.
 *
 * Kept in step with `apps/api/src/modules/setting/setting.schema.ts` by hand: that schema
 * imports server-only code, so its inferred type cannot be imported into the website.
 */
export interface SiteSettings {
  general: {
    siteName: string;
    ownerName: string;
    tagline: string;
    bio: string;
    logo?: string | null;
    favicon?: string | null;
    avatar?: string | null;
    email?: string | null;
    phone?: string | null;
    location?: string | null;
    resumeUrl?: string | null;
    availableForWork: boolean;
  };
  hero: {
    greeting: string;
    headline: string;
    subheadline: string;
    roles: string[];
    image?: string | null;
    primaryCta: Link;
    secondaryCta: Link;
  };
  socials: Partial<
    Record<
      'github' | 'linkedin' | 'twitter' | 'facebook' | 'youtube' | 'whatsapp' | 'upwork' | 'fiverr',
      string | null
    >
  >;
  theme: { accentColor: string; defaultMode: 'dark' | 'light' | 'system' };
  sections: { items: { key: SectionKey; enabled: boolean }[] };
  seo: {
    siteUrl?: string | null;
    titleTemplate: string;
    defaultTitle: string;
    defaultDescription: string;
    keywords: string[];
    ogImage?: string | null;
    twitterHandle?: string | null;
    googleSiteVerification?: string | null;
  };
  integrations: { gaMeasurementId?: string | null; turnstileSiteKey?: string | null };
}
