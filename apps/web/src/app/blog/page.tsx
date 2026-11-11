import type { Metadata } from 'next';
import { PostCard } from '@/components/sections/Blog';
import { Newsletter } from '@/components/sections/Closing';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterLinks } from '@/components/ui/FilterLinks';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { Container } from '@/components/ui/Section';
import { getList, getPage, getPageSeo, getSettings } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import type { BlogCategory, Post } from '@/lib/types';

const DESCRIPTION =
  'Notes on building web software: frontend, backend, databases and the lessons in between.';
const PAGE_SIZE = 9;

interface PageProps {
  searchParams: Promise<{ category?: string; tag?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { category, tag, page } = await searchParams;
  const [settings, seo] = await Promise.all([getSettings(), getPageSeo('blog')]);
  const metadata = buildMetadata(settings, {
    title: 'Blog',
    description: DESCRIPTION,
    path: '/blog',
    seo,
  });

  // Filtered and deeper pages repeat the main list, so only the main list is indexed.
  return category || tag || (page && page !== '1')
    ? { ...metadata, robots: { index: false, follow: true } }
    : metadata;
}

export default async function BlogPage({ searchParams }: PageProps) {
  const { category, tag, page } = await searchParams;
  const pageNumber = Math.max(1, Number.parseInt(page ?? '1', 10) || 1);

  const [{ items: posts, meta }, categories] = await Promise.all([
    getPage<Post>('blogs', {
      sort: 'publishedAt',
      order: 'desc',
      limit: PAGE_SIZE,
      page: pageNumber,
      category,
      tag,
    }),
    getList<BlogCategory>('blog-categories', { sort: 'order', order: 'asc' }),
  ]);

  const hrefFor = (target: number) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (tag) params.set('tag', tag);
    if (target > 1) params.set('page', String(target));
    const query = params.toString();
    return query ? `/blog?${query}` : '/blog';
  };

  return (
    <>
      <PageHeader eyebrow="Blog" title="Articles" description={DESCRIPTION} />
      <Container className="pb-12">
        <div className="mb-10 flex flex-wrap items-center gap-4">
          <FilterLinks
            label="Filter articles by category"
            basePath="/blog"
            param="category"
            active={category}
            options={categories
              .filter((item) => item._count.posts > 0)
              .map((item) => ({ label: item.name, value: item.slug }))}
          />
          {tag && <p className="text-muted">Tagged “{tag}”</p>}
        </div>

        {posts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <PostCard key={post.id} post={post} index={index % 3} headingLevel="h2" />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No articles here yet"
            description="Try another category, or check back soon."
          />
        )}
        <Pagination meta={meta} hrefFor={hrefFor} />
      </Container>
      <Newsletter />
    </>
  );
}
