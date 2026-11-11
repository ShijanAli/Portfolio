import { ArrowUpRight, CodeXml } from 'lucide-react';
import Image from 'next/image';
import { StackedCards } from '@/components/motion/ScrollFx';
import { ButtonLink } from '@/components/ui/Button';
import { Card, Tag } from '@/components/ui/Card';
import { Container, Section, SectionHeading } from '@/components/ui/Section';
import type { Project } from '@/lib/types';

/** Cover image, or a generated placeholder so a project without one still looks finished. */
export function ProjectVisual({ project, index }: { project: Project; index: number }) {
  if (project.coverImage) {
    return (
      <Image
        src={project.coverImage}
        alt={`Screenshot of ${project.title}`}
        fill
        sizes="(min-width: 1024px) 40rem, 100vw"
        className="object-cover"
      />
    );
  }

  return (
    <div
      aria-hidden
      className="absolute inset-0 grid place-items-center bg-[radial-gradient(120%_120%_at_0%_0%,color-mix(in_oklab,var(--color-accent)_55%,transparent),transparent_60%),radial-gradient(90%_90%_at_100%_100%,color-mix(in_oklab,var(--color-accent)_25%,transparent),transparent_60%)]"
    >
      <span className="text-[9rem] leading-none font-semibold tracking-tighter text-fg/10">
        {String(index + 1).padStart(2, '0')}
      </span>
    </div>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    // Each card sticks a little lower than the one before, so the stack stays visible.
    <li data-stack-card className="sticky pb-8" style={{ top: `calc(6rem + ${index * 1.25}rem)` }}>
      <Card className="grid origin-top gap-0 will-change-transform lg:grid-cols-2">
        <div className="flex flex-col p-8 md:p-12">
          <div className="flex flex-wrap items-center gap-2">
            {project.category && (
              <Tag className="border-accent/40 text-fg">{project.category.name}</Tag>
            )}
            {project.role && <Tag>{project.role}</Tag>}
          </div>
          <h3 className="mt-6 text-3xl font-semibold tracking-tight md:text-5xl">
            {project.title}
          </h3>
          <p className="mt-4 text-lg text-pretty text-muted">{project.summary}</p>

          {project.technologies.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Technologies">
              {project.technologies.map((technology) => (
                <li key={technology.id}>
                  <Tag>{technology.name}</Tag>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-auto flex flex-wrap gap-3 pt-10">
            <ButtonLink
              href={`/projects/${project.slug}`}
              aria-label={`Case study: ${project.title}`}
            >
              Case study
              <ArrowUpRight className="size-4" aria-hidden />
            </ButtonLink>
            {project.liveUrl && (
              <ButtonLink
                href={project.liveUrl}
                variant="secondary"
                aria-label={`Visit ${project.title}`}
              >
                Live site
                <ArrowUpRight className="size-4" aria-hidden />
              </ButtonLink>
            )}
            {project.githubUrl && (
              <ButtonLink
                href={project.githubUrl}
                variant="secondary"
                aria-label={`Source code of ${project.title}`}
              >
                <CodeXml className="size-4" aria-hidden />
                Code
              </ButtonLink>
            )}
          </div>
        </div>
        <div className="relative min-h-64 overflow-hidden border-t border-border lg:min-h-[30rem] lg:border-t-0 lg:border-l">
          <ProjectVisual project={project} index={index} />
        </div>
      </Card>
    </li>
  );
}

export function Projects({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;

  return (
    <Section id="projects">
      <Container>
        <SectionHeading
          eyebrow="Selected work"
          title="Projects I am proud of"
          description="A few products I designed, built and shipped."
          action={
            <ButtonLink href="/projects" variant="secondary">
              All projects
            </ButtonLink>
          }
        />
        <StackedCards>
          <ul>
            {projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </ul>
        </StackedCards>
      </Container>
    </Section>
  );
}
