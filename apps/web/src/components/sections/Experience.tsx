import { ProgressLine } from '@/components/motion/ScrollFx';
import { Tag } from '@/components/ui/Card';
import { Container, Section, SectionHeading } from '@/components/ui/Section';
import { formatPeriod } from '@/lib/format';
import type { Experience as ExperienceItem } from '@/lib/types';

export function Experience({ experiences }: { experiences: ExperienceItem[] }) {
  if (experiences.length === 0) return null;

  return (
    <Section id="experience">
      <Container>
        <SectionHeading eyebrow="Experience" title="Where I have worked" />

        <div className="relative">
          {/* The faint rail, and the accent line that fills it as you scroll. */}
          <div
            aria-hidden
            className="absolute top-2 bottom-2 left-[5px] w-px bg-border md:left-[13.5rem]"
          />
          <ProgressLine className="absolute top-2 bottom-2 left-[5px] w-px md:left-[13.5rem]" />

          <ol className="space-y-14">
            {experiences.map((item) => (
              <li
                key={item.id}
                data-reveal
                className="relative grid gap-3 pl-8 md:grid-cols-[12rem_1fr] md:gap-12 md:pl-0"
              >
                <span
                  aria-hidden
                  className="absolute top-2 left-0 size-[11px] rounded-full border-2 border-accent bg-bg md:left-[calc(13.5rem-5px)]"
                />
                <p className="font-mono text-sm text-muted md:pt-1 md:text-right">
                  {formatPeriod(item.startDate, item.endDate, item.isCurrent)}
                </p>
                <div className="md:pl-12">
                  <h3 className="text-2xl font-semibold tracking-tight">{item.position}</h3>
                  <p className="mt-1 text-muted">
                    {item.company}
                    {item.location && ` · ${item.location}`}
                    {item.employmentType && ` · ${item.employmentType}`}
                  </p>
                  {item.description && (
                    <p className="mt-4 max-w-2xl text-pretty text-fg/85">{item.description}</p>
                  )}
                  {item.highlights.length > 0 && (
                    <ul className="mt-4 max-w-2xl list-disc space-y-1.5 pl-5 text-fg/85 marker:text-accent-text">
                      {item.highlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                  )}
                  {item.techStack.length > 0 && (
                    <ul className="mt-5 flex flex-wrap gap-2" aria-label="Technologies used">
                      {item.techStack.map((technology) => (
                        <li key={technology}>
                          <Tag>{technology}</Tag>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}
