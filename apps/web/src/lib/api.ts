import 'server-only';
import type { ApiSuccess, ListQuery, Paginated } from '@portfolio/api-client';
import { API_URL } from './env';
import { SECTION_KEYS, type Seo, type SiteSettings } from './types';

/** How long rendered data may be reused before it is fetched again, in seconds. */
const REVALIDATE_SECONDS = 300;

interface FetchOptions {
  query?: ListQuery;
  /** Cache tags, so the admin can refresh exactly the pages that use this data. */
  tags: string[];
}

function toSearch(query: ListQuery = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

/**
 * Reads from the API on the server. Returns `null` when the API cannot be reached or
 * answers with an error, so one failing request degrades a section instead of the page.
 */
async function apiFetch<T>(
  path: string,
  { query, tags }: FetchOptions,
): Promise<ApiSuccess<T> | null> {
  try {
    const response = await fetch(`${API_URL}${path}${toSearch(query)}`, {
      next: { revalidate: REVALIDATE_SECONDS, tags },
    });
    if (!response.ok) return null;
    return (await response.json()) as ApiSuccess<T>;
  } catch {
    return null;
  }
}

const apiGet = async <T>(path: string, options: FetchOptions) =>
  (await apiFetch<T>(path, options))?.data ?? null;

/** A published list, or an empty one when the API is unavailable. */
export async function getList<T>(resource: string, query: ListQuery = {}): Promise<T[]> {
  return (
    (await apiGet<T[]>(`/${resource}`, { query: { limit: 100, ...query }, tags: [resource] })) ?? []
  );
}

export const getBySlug = <T>(resource: string, slug: string) =>
  apiGet<T>(`/${resource}/slug/${encodeURIComponent(slug)}`, { tags: [resource] });

/** Used only if the API is down, so the site still renders its frame. */
const FALLBACK_SETTINGS: SiteSettings = {
  general: { siteName: 'Portfolio', ownerName: '', tagline: '', bio: '', availableForWork: true },
  hero: {
    greeting: "Hi, I'm",
    headline: '',
    subheadline: '',
    roles: [],
    primaryCta: { label: 'Book a call', href: '/book' },
    secondaryCta: { label: 'View projects', href: '/projects' },
  },
  socials: {},
  theme: { accentColor: '#7c5cff', defaultMode: 'dark' },
  sections: { items: SECTION_KEYS.map((key) => ({ key, enabled: true })) },
  seo: {
    titleTemplate: '%s | Portfolio',
    defaultTitle: 'Portfolio',
    defaultDescription: '',
    keywords: [],
  },
  integrations: {},
};

export async function getSettings(): Promise<SiteSettings> {
  return (await apiGet<SiteSettings>('/settings', { tags: ['settings'] })) ?? FALLBACK_SETTINGS;
}

/** SEO record of a fixed page such as "home" or "blog". Null until one is saved in the admin. */
export const getPageSeo = (pageKey: string) =>
  apiGet<Seo>(`/seo/pages/${pageKey}`, { tags: ['seo'] });

/** One page of a list, with the totals needed to render pagination. */
export async function getPage<T>(resource: string, query: ListQuery): Promise<Paginated<T>> {
  const response = await apiFetch<T[]>(`/${resource}`, { query, tags: [resource] });
  const items = response?.data ?? [];
  return {
    items,
    meta: response?.meta ?? { page: 1, limit: items.length, total: items.length, totalPages: 1 },
  };
}

export interface SitemapData {
  projects: { slug: string; updatedAt: string }[];
  services: { slug: string; updatedAt: string }[];
  posts: { slug: string; updatedAt: string }[];
}

export const getSitemapData = () =>
  apiGet<SitemapData>('/seo/sitemap', { tags: ['projects', 'services', 'blogs'] });
