import type { Metadata } from 'next';
import { SITE_URL } from './env';
import type { Post, Project, Seo, Service, SiteSettings } from './types';

interface PageMeta {
  /** Page title without the site name. Omit on the home page to use the site's default title. */
  title?: string;
  description?: string | null;
  /** Path of the page, e.g. "/blog/my-post". */
  path: string;
  /** SEO record edited in the admin; its values win over the defaults above. */
  seo?: Seo | null;
  image?: string | null;
  type?: 'website' | 'article';
}

export const siteUrlOf = (settings: SiteSettings) =>
  (settings.seo.siteUrl ?? SITE_URL).replace(/\/$/, '');

/**
 * The single place page metadata is built. Precedence for every value:
 * the item's own SEO record, then what the page passes in, then the site-wide defaults.
 */
export function buildMetadata(settings: SiteSettings, page: PageMeta): Metadata {
  const { seo } = page;
  const title = seo?.metaTitle ?? page.title;
  const description = seo?.metaDescription ?? page.description ?? settings.seo.defaultDescription;
  const image = seo?.ogImage ?? page.image ?? settings.seo.ogImage ?? undefined;
  const url = seo?.canonicalUrl ?? `${siteUrlOf(settings)}${page.path === '/' ? '' : page.path}`;
  const keywords = seo?.keywords?.length ? seo.keywords : settings.seo.keywords;

  return {
    title: title ?? { absolute: settings.seo.defaultTitle },
    description,
    keywords,
    alternates: { canonical: url },
    robots: seo?.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: page.type ?? 'website',
      url,
      siteName: settings.general.siteName,
      title: seo?.ogTitle ?? title ?? settings.seo.defaultTitle,
      description: seo?.ogDescription ?? description,
      images: image ? [image] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      creator: settings.seo.twitterHandle ?? undefined,
    },
  };
}

/** schema.org description of the site owner and the site, for rich search results. */
export function buildSiteJsonLd(settings: SiteSettings) {
  const url = siteUrlOf(settings);
  const { general } = settings;
  const sameAs = Object.values(settings.socials).filter((link): link is string => Boolean(link));

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: general.ownerName || general.siteName,
      url,
      jobTitle: general.tagline || undefined,
      description: general.bio || undefined,
      image: general.avatar ?? undefined,
      email: general.email ?? undefined,
      sameAs: sameAs.length > 0 ? sameAs : undefined,
    },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: general.siteName, url },
  ];
}

/** Plain text of rich content, e.g. for a description when no summary was written. */
export const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const personOf = (settings: SiteSettings) => ({
  '@type': 'Person',
  name: settings.general.ownerName || settings.general.siteName,
  url: siteUrlOf(settings),
});

export function buildPostJsonLd(settings: SiteSettings, post: Post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.coverImage ?? undefined,
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    author: personOf(settings),
    mainEntityOfPage: `${siteUrlOf(settings)}/blog/${post.slug}`,
    keywords: post.tags.map((tag) => tag.name).join(', ') || undefined,
  };
}

export function buildProjectJsonLd(settings: SiteSettings, project: Project) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.summary,
    image: project.coverImage ?? undefined,
    url: `${siteUrlOf(settings)}/projects/${project.slug}`,
    creator: personOf(settings),
    keywords: project.technologies.map((technology) => technology.name).join(', ') || undefined,
  };
}

/** A service, plus its FAQ in the form search engines can show as expandable answers. */
export function buildServiceJsonLd(settings: SiteSettings, service: Service) {
  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.shortDesc,
    url: `${siteUrlOf(settings)}/services/${service.slug}`,
    provider: personOf(settings),
  };
  if (service.faqs.length === 0) return [serviceLd];

  return [
    serviceLd,
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: service.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ];
}
