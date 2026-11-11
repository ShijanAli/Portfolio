import type { Post, PostStatus } from '@prisma/client';
import { BaseService, type Where } from '@/common/base/base.service';
import type { ListQuery } from '@/common/utils/query-builder';
import { readingTime } from '@/common/utils/reading-time';
import { connectIds, createSeo, setIds, upsertSeo } from '@/common/utils/relations';
import { prisma } from '@/lib/prisma';
import type { CreatePostInput, UpdatePostInput } from './blog.schema';

export type CreatePostData = CreatePostInput & { authorId: string };

/**
 * A scheduled post goes live by itself: visitors see PUBLISHED and SCHEDULED posts whose
 * publish date has passed, so no background job has to flip the status.
 */
export const livePostScope = (): Where => ({
  status: { in: ['PUBLISHED', 'SCHEDULED'] satisfies PostStatus[] },
  publishedAt: { lte: new Date() },
});

class BlogService extends BaseService<Post, CreatePostData, UpdatePostInput> {
  constructor() {
    super(prisma.post, {
      resource: 'Post',
      slugFrom: 'title',
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: true,
        tags: true,
        seo: true,
      },
      listOmit: { content: true },
      searchFields: ['title', 'excerpt'],
      filterFields: ['status', 'isFeatured'],
      sortFields: ['title', 'views', 'publishedAt', 'createdAt'],
      defaultSort: { field: 'createdAt', order: 'desc' },
    });
  }

  protected override extraWhere(query: ListQuery): Where {
    const where: Where = {};
    if (typeof query.category === 'string') where.category = { slug: query.category };
    if (typeof query.tag === 'string') where.tags = { some: { slug: query.tag } };
    return where;
  }

  protected override async prepareCreate({ tagIds, seo, ...data }: CreatePostData) {
    return {
      ...data,
      readingTime: readingTime(data.content),
      publishedAt: data.publishedAt ?? (data.status === 'PUBLISHED' ? new Date() : undefined),
      tags: { connect: connectIds(tagIds) },
      seo: createSeo(seo),
    };
  }

  protected override async prepareUpdate({ tagIds, seo, ...data }: UpdatePostInput, id: string) {
    return {
      ...data,
      readingTime: data.content === undefined ? undefined : readingTime(data.content),
      publishedAt: data.publishedAt ?? (await this.firstPublishDate(id, data.status)),
      tags: setIds(tagIds),
      seo: upsertSeo(seo),
    };
  }

  /** Stamps the publish date the first time a post is published, and never moves it after. */
  private async firstPublishDate(id: string, status: UpdatePostInput['status']) {
    if (status !== 'PUBLISHED') return undefined;
    const existing = await prisma.post.findUnique({ where: { id }, select: { publishedAt: true } });
    return existing?.publishedAt ? undefined : new Date();
  }
}

export const blogService = new BlogService();
