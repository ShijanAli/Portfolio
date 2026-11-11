import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NewsletterForm } from '@/components/forms/NewsletterForm';
import { JsonLd } from '@/components/layout/JsonLd';
import { ViewCounter } from '@/components/layout/ViewCounter';
import { PostCard } from '@/components/sections/Blog';
import { Card, Tag } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { RichText } from '@/components/ui/RichText';
import { Container } from '@/components/ui/Section';
import { getBySlug, getList, getSettings } from '@/lib/api';
import { formatLongDate } from '@/lib/format';
import { buildMetadata, buildPostJsonLd, stripHtml } from '@/lib/seo';
import type { Post } from '@/lib/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return (await getList<Post>('blogs')).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [settings, post] = await Promise.all([getSettings(), getBySlug<Post>('blogs', slug)]);
  if (!post) return {};

  return buildMetadata(settings, {
    title: post.title,
    description: post.excerpt ?? stripHtml(post.content).slice(0, 160),
    path: `/blog/${post.slug}`,
    image: post.coverImage,
    seo: post.seo,
    type: 'article',
  });
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const [settings, post] = await Promise.all([getSettings(), getBySlug<Post>('blogs', slug)]);
  if (!post) notFound();

  // Other articles from the same category, or simply the latest ones.
  const candidates = await getList<Post>('blogs', {
    sort: 'publishedAt',
    order: 'desc',
    limit: 4,
    category: post.category?.slug,
  });
  const related = candidates.filter((item) => item.id !== post.id).slice(0, 3);

  return (
    <article>
      <PageHeader
        compact
        title={post.title}
        description={post.excerpt}
        breadcrumbs={[{ label: 'Blog', href: '/blog' }]}
      >
        <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-muted">
          {post.category && (
            <Link href={`/blog?category=${post.category.slug}`}>
              <Tag className="border-accent/40 text-fg hover:border-accent">
                {post.category.name}
              </Tag>
            </Link>
          )}
          <span>By {post.author.name}</span>
          {post.publishedAt && (
            <>
              <span aria-hidden>·</span>
              <time dateTime={post.publishedAt}>{formatLongDate(post.publishedAt)}</time>
            </>
          )}
          <span aria-hidden>·</span>
          <span>{post.readingTime} min read</span>
        </p>
      </PageHeader>

      <Container className="pb-24">
        {post.coverImage && (
          <div
            data-reveal
            className="relative mb-14 aspect-[16/9] overflow-hidden rounded-3xl border border-border"
          >
            <Image
              src={post.coverImage}
              alt=""
              fill
              priority
              sizes="(min-width: 1280px) 80rem, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <div className="mx-auto max-w-3xl">
          <RichText html={post.content} />

          {post.tags.length > 0 && (
            <ul
              className="mt-12 flex flex-wrap gap-2 border-t border-border pt-8"
              aria-label="Tags"
            >
              {post.tags.map((tag) => (
                <li key={tag.id}>
                  <Link href={`/blog?tag=${tag.slug}`}>
                    <Tag className="hover:border-accent hover:text-fg">#{tag.name}</Tag>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Card className="mt-14 p-8">
            <h2 className="text-2xl font-semibold tracking-tight">Enjoyed this article?</h2>
            <p className="mt-2 mb-6 text-muted">
              Get the next one in your inbox. No spam, unsubscribe any time.
            </p>
            <NewsletterForm source="blog" />
          </Card>
        </div>

        {related.length > 0 && (
          <section className="mt-24">
            <h2 className="mb-8 text-3xl font-semibold tracking-tight md:text-4xl">Keep reading</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((item, index) => (
                <PostCard key={item.id} post={item} index={index} />
              ))}
            </div>
          </section>
        )}
      </Container>

      <ViewCounter resource="blogs" slug={post.slug} />
      <JsonLd data={buildPostJsonLd(settings, post)} />
    </article>
  );
}
