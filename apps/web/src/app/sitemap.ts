import type { MetadataRoute } from 'next';
import { getSitemapData } from '@/lib/api';
import { SITE_URL } from '@/lib/env';

const STATIC_PAGES = ['/projects', '/services', '/blog', '/book'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getSitemapData();
  const entries = (prefix: string, items: { slug: string; updatedAt: string }[] = []) =>
    items.map((item) => ({
      url: `${SITE_URL}${prefix}/${item.slug}`,
      lastModified: item.updatedAt,
    }));

  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    ...STATIC_PAGES.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...entries('/projects', data?.projects),
    ...entries('/services', data?.services),
    ...entries('/blog', data?.posts),
  ];
}
