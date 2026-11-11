import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { ProjectVisual } from '@/components/sections/Projects';
import { Card, Tag } from '@/components/ui/Card';
import type { Project } from '@/lib/types';

/** A project in a grid: cover, title, summary and technologies, linking to its case study. */
export function ProjectTile({ project, index }: { project: Project; index: number }) {
  return (
    <article
      data-reveal
      style={{ '--reveal-delay': `${(index % 2) * 90}ms` } as React.CSSProperties}
      className="h-full"
    >
      <Card
        data-cursor="View"
        className="group flex h-full flex-col transition-colors hover:border-muted/50"
      >
        <div className="relative aspect-[16/10] overflow-hidden border-b border-border">
          <div className="absolute inset-0 transition-transform duration-700 ease-out-expo group-hover:scale-105">
            <ProjectVisual project={project} index={index} />
          </div>
        </div>
        <div className="flex flex-1 flex-col p-7">
          {project.category && (
            <Tag className="self-start border-accent/40 text-fg">{project.category.name}</Tag>
          )}
          <h2 className="mt-4 flex items-start justify-between gap-4 text-2xl font-semibold tracking-tight md:text-3xl">
            <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0">
              {project.title}
            </Link>
            <ArrowUpRight
              className="mt-1 size-6 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent-text"
              aria-hidden
            />
          </h2>
          <p className="mt-3 text-muted">{project.summary}</p>
          {project.technologies.length > 0 && (
            <ul className="mt-auto flex flex-wrap gap-2 pt-6" aria-label="Technologies">
              {project.technologies.slice(0, 5).map((technology) => (
                <li key={technology.id}>
                  <Tag>{technology.name}</Tag>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </article>
  );
}
