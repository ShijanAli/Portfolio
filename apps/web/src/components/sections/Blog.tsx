import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';
import { Card, Tag } from '@/components/ui/Card';
import { Container, Section, SectionHeading } from '@/components/ui/Section';
import { formatLongDate } from '@/lib/format';
import type { Post } from '@/lib/types';

interface PostCardProps {
  post: Post;
  index?: number;
  /** Heading level of the title, so the card fits the outline of the page it is on. */
  headingLevel?: 'h2' | 'h3';
}

export function PostCard({ post, index = 0, headingLevel: Heading = 'h3' }: PostCardProps) {
  return (
    <article
      data-reveal
      style={{ '--reveal-delay': `${index * 90}ms` } as React.CSSProperties}
      className="h-full"
    >
      <Card
        data-cursor="Read"
        className="group flex h-full flex-col transition-colors hover:border-muted/50"
      >
        <div className="relative aspect-[16/10] overflow-hidden border-b border-border bg-raised">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt=""
              fill
              sizes="(min-width: 1024px) 26rem, 100vw"
              className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
            />
          ) : (
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(110%_110%_at_100%_0%,color-mix(in_oklab,var(--color-accent)_40%,transparent),transparent_60%)]"
            />
          )}
        </div>
        <div className="flex flex-1 flex-col p-7">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            {post.category && <Tag>{post.category.name}</Tag>}
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>{formatLongDate(post.publishedAt)}</time>
            )}
            <span aria-hidden>·</span>
            <span>{post.readingTime} min read</span>
          </div>
          <Heading className="mt-4 text-2xl font-semibold tracking-tight text-balance">
            {/* The stretched link makes the whole card clickable with one focus stop. */}
            <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
              {post.title}
            </Link>
          </Heading>
          {post.excerpt && <p className="mt-3 line-clamp-3 text-muted">{post.excerpt}</p>}
          <p className="mt-auto flex items-center gap-1.5 pt-6 text-sm font-medium text-accent-text">
            Read article
            <ArrowUpRight
              className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </p>
        </div>
      </Card>
    </article>
  );
}

export function Blog({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <Section id="blog">
      <Container>
        <SectionHeading
          eyebrow="Blog"
          title="Notes from building things"
          action={
            <ButtonLink href="/blog" variant="secondary">
              All articles
            </ButtonLink>
          }
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
