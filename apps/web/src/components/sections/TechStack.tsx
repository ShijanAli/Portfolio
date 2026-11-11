import { Marquee } from '@/components/motion/Marquee';
import { Container, Section, SectionHeading } from '@/components/ui/Section';
import type { Technology } from '@/lib/types';

function Row({ technologies, reverse }: { technologies: Technology[]; reverse?: boolean }) {
  return (
    <Marquee reverse={reverse} duration={Math.max(25, technologies.length * 5)}>
      {technologies.map((technology) => (
        <span
          key={technology.id}
          className="mx-3 rounded-full border border-border bg-surface px-7 py-4 text-xl font-medium tracking-tight whitespace-nowrap md:text-2xl"
        >
          {technology.name}
        </span>
      ))}
    </Marquee>
  );
}

export function TechStack({ technologies }: { technologies: Technology[] }) {
  if (technologies.length === 0) return null;

  // Two rows moving in opposite directions; with few items one row is enough.
  const middle = Math.ceil(technologies.length / 2);
  const rows =
    technologies.length >= 8
      ? [technologies.slice(0, middle), technologies.slice(middle)]
      : [technologies];

  return (
    <Section id="techStack" className="overflow-hidden">
      <Container>
        <SectionHeading eyebrow="Tech stack" title="Tools I work with every day" />
      </Container>
      {/* The full list, once, for screen readers; the moving rows are decoration. */}
      <ul className="sr-only">
        {technologies.map((technology) => (
          <li key={technology.id}>{technology.name}</li>
        ))}
      </ul>
      <div aria-hidden className="space-y-5">
        {rows.map((row, index) => (
          <Row key={index} technologies={row} reverse={index % 2 === 1} />
        ))}
      </div>
    </Section>
  );
}
