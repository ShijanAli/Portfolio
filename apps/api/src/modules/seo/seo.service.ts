import { PUBLISHED_SCOPE } from '@/common/schemas/common.schema';
import { livePostScope } from '@/modules/blog/blog.service';
import { prisma } from '@/lib/prisma';
import { PAGE_KEYS, type PageKey, type UpsertPageSeoInput } from './seo.schema';

const sitemapEntry = { slug: true, updatedAt: true } as const;

class SeoService {
  /** Every static page, with `null` for pages that have no SEO record yet. */
  async listPages() {
    const records = await prisma.seo.findMany({ where: { pageKey: { in: [...PAGE_KEYS] } } });
    const byKey = new Map(records.map((record) => [record.pageKey, record]));
    return PAGE_KEYS.map((pageKey) => ({ pageKey, seo: byKey.get(pageKey) ?? null }));
  }

  getPage(pageKey: PageKey) {
    return prisma.seo.findUnique({ where: { pageKey } });
  }

  upsertPage(pageKey: PageKey, input: UpsertPageSeoInput) {
    return prisma.seo.upsert({
      where: { pageKey },
      create: { ...input, pageKey },
      update: input,
    });
  }

  /** Everything the website needs to build sitemap.xml: only publicly visible content. */
  async getSitemap() {
    const [projects, services, posts] = await Promise.all([
      prisma.project.findMany({ where: PUBLISHED_SCOPE, select: sitemapEntry }),
      prisma.service.findMany({ where: PUBLISHED_SCOPE, select: sitemapEntry }),
      prisma.post.findMany({ where: livePostScope(), select: sitemapEntry }),
    ]);
    return { projects, services, posts };
  }
}

export const seoService = new SeoService();
