import { ArrowUpRight, CodeXml } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ProjectTile } from '@/components/cards/ProjectTile';
import { JsonLd } from '@/components/layout/JsonLd';
import { ViewCounter } from '@/components/layout/ViewCounter';
import { BookingCta } from '@/components/sections/Closing';
import { ButtonLink } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { RichText } from '@/components/ui/RichText';
import { Container } from '@/components/ui/Section';
import { getBySlug, getList, getSettings } from '@/lib/api';
import { formatMonthYear } from '@/lib/format';
import { buildMetadata, buildProjectJsonLd } from '@/lib/seo';
import type { Project } from '@/lib/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return (await getList<Project>('projects')).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [settings, project] = await Promise.all([
    getSettings(),
    getBySlug<Project>('projects', slug),
  ]);
  if (!project) return {};

  return buildMetadata(settings, {
    title: project.title,
    description: project.summary,
    path: `/projects/${project.slug}`,
    image: project.coverImage,
    seo: project.seo,
  });
}

/** "Jan 2024 – Mar 2024", or just the part that is known. */
const periodOf = (project: Project) =>
  [project.startDate, project.endDate]
    .filter((date): date is string => Boolean(date))
    .map(formatMonthYear)
    .join(' – ');

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const [settings, project, all] = await Promise.all([
    getSettings(),
    getBySlug<Project>('projects', slug),
    getList<Project>('projects', { sort: 'order', order: 'asc' }),
  ]);
  if (!project) notFound();

  const facts = [
    ['Client', project.client],
    ['Role', project.role],
    ['Timeline', periodOf(project)],
    ['Category', project.category?.name],
  ].filter((fact): fact is [string, string] => Boolean(fact[1]));
  const others = all.filter((item) => item.id !== project.id).slice(0, 2);

  return (
    <>
      <PageHeader
        compact
        eyebrow="Case study"
        title={project.title}
        description={project.summary}
        breadcrumbs={[{ label: 'Projects', href: '/projects' }]}
      >
        <div className="flex flex-wrap gap-3">
          {project.liveUrl && (
            <ButtonLink href={project.liveUrl}>
              Visit live site
              <ArrowUpRight className="size-4" aria-hidden />
            </ButtonLink>
          )}
          {project.githubUrl && (
            <ButtonLink href={project.githubUrl} variant="secondary">
              <CodeXml className="size-4" aria-hidden />
              Source code
            </ButtonLink>
          )}
        </div>
      </PageHeader>

      <Container className="pb-24">
        {project.coverImage && (
          <div
            data-reveal
            className="relative mb-16 aspect-[16/9] overflow-hidden rounded-3xl border border-border"
          >
            <Image
              src={project.coverImage}
              alt={`Screenshot of ${project.title}`}
              fill
              priority
              sizes="(min-width: 1280px) 80rem, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <div className="grid gap-12 lg:grid-cols-[16rem_1fr] lg:gap-20">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <dl className="space-y-5">
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt className="font-mono text-xs tracking-[0.2em] text-muted uppercase">
                    {label}
                  </dt>
                  <dd className="mt-1 text-lg">{value}</dd>
                </div>
              ))}
            </dl>
            {project.technologies.length > 0 && (
              <>
                <p className="mt-8 mb-3 font-mono text-xs tracking-[0.2em] text-muted uppercase">
                  Built with
                </p>
                <ul className="flex flex-wrap gap-2">
                  {project.technologies.map((technology) => (
                    <li key={technology.id}>
                      <Tag>{technology.name}</Tag>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </aside>

          <div className="min-w-0">
            {project.content && <RichText html={project.content} className="max-w-3xl" />}

            {project.gallery.length > 0 && (
              <ul className="mt-14 grid gap-5 sm:grid-cols-2">
                {project.gallery.map((image, index) => (
                  <li
                    key={image}
                    className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border"
                  >
                    <Image
                      src={image}
                      alt={`${project.title} screenshot ${index + 1}`}
                      fill
                      sizes="(min-width: 640px) 28rem, 100vw"
                      className="object-cover"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {others.length > 0 && (
          <section className="mt-28">
            <h2 className="mb-8 text-3xl font-semibold tracking-tight md:text-4xl">
              More projects
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {others.map((item, index) => (
                <ProjectTile key={item.id} project={item} index={index} />
              ))}
            </div>
          </section>
        )}
      </Container>

      <BookingCta settings={settings} />
      <ViewCounter resource="projects" slug={project.slug} />
      <JsonLd data={buildProjectJsonLd(settings, project)} />
    </>
  );
}
