import type { Metadata } from 'next';
import { ProjectTile } from '@/components/cards/ProjectTile';
import { BookingCta } from '@/components/sections/Closing';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterLinks } from '@/components/ui/FilterLinks';
import { PageHeader } from '@/components/ui/PageHeader';
import { Container } from '@/components/ui/Section';
import { getList, getPageSeo, getSettings } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import type { Project, ProjectCategory } from '@/lib/types';

const DESCRIPTION =
  'Products I designed, built and shipped: business software, online stores and dashboards.';

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const [settings, seo] = await Promise.all([getSettings(), getPageSeo('projects')]);
  return buildMetadata(settings, {
    title: 'Projects',
    description: DESCRIPTION,
    path: '/projects',
    seo,
  });
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const { category } = await searchParams;
  const [settings, projects, categories] = await Promise.all([
    getSettings(),
    getList<Project>('projects', { sort: 'order', order: 'asc', category }),
    getList<ProjectCategory>('project-categories', { sort: 'order', order: 'asc' }),
  ]);

  return (
    <>
      <PageHeader eyebrow="Work" title="Projects" description={DESCRIPTION} />
      <Container className="pb-24">
        <div className="mb-10">
          <FilterLinks
            label="Filter projects by category"
            basePath="/projects"
            param="category"
            active={category}
            options={categories
              .filter((item) => item._count.projects > 0)
              .map((item) => ({ label: item.name, value: item.slug }))}
          />
        </div>
        {projects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {projects.map((project, index) => (
              <ProjectTile key={project.id} project={project} index={index} />
            ))}
          </div>
        ) : (
          <EmptyState title="No projects here yet" description="Try another category." />
        )}
      </Container>
      <BookingCta settings={settings} />
    </>
  );
}
