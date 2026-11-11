import { ArrowUpRight, Check } from 'lucide-react';
import Link from 'next/link';
import { Tilt } from '@/components/motion/Pointer';
import { HorizontalScroll } from '@/components/motion/ScrollFx';
import { Card } from '@/components/ui/Card';
import { Container, Section, SectionHeading } from '@/components/ui/Section';
import { formatPrice } from '@/lib/format';
import type { Service } from '@/lib/types';

interface ServiceCardProps {
  service: Service;
  index: number;
  className?: string;
  /** Heading level of the title, so the card fits the outline of the page it is on. */
  headingLevel?: 'h2' | 'h3';
}

export function ServiceCard({
  service,
  index,
  className,
  headingLevel: Heading = 'h3',
}: ServiceCardProps) {
  return (
    <Tilt className={className}>
      <Card interactive className="group flex h-full min-h-[26rem] flex-col p-8">
        <p className="font-mono text-sm text-accent-text">{String(index + 1).padStart(2, '0')}</p>
        <Heading className="mt-6 text-2xl font-semibold tracking-tight">
          {/* The stretched link makes the whole card clickable with one focus stop. */}
          <Link href={`/services/${service.slug}`} className="after:absolute after:inset-0">
            {service.title}
          </Link>
        </Heading>
        <p className="mt-3 text-muted">{service.shortDesc}</p>

        {service.features.length > 0 && (
          <ul className="mt-6 space-y-2.5">
            {service.features.slice(0, 5).map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden />
                {feature}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-end justify-between gap-4 pt-8">
          {service.startingPrice !== null ? (
            <p className="text-sm text-muted">
              Starting from{' '}
              <span className="text-lg font-semibold text-fg">
                {formatPrice(service.startingPrice, service.currency)}
              </span>
            </p>
          ) : (
            <span />
          )}
          <ArrowUpRight
            className="size-5 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent-text"
            aria-hidden
          />
        </div>
      </Card>
    </Tilt>
  );
}

export function Services({ services }: { services: Service[] }) {
  if (services.length === 0) return null;

  return (
    <Section id="services" className="overflow-hidden">
      <Container>
        <SectionHeading
          eyebrow="Services"
          title="What I can build for you"
          description="From a first idea to a product running in production."
        />
      </Container>
      <HorizontalScroll>
        {services.map((service, index) => (
          <ServiceCard
            key={service.id}
            service={service}
            index={index}
            className="w-[82vw] shrink-0 sm:w-[26rem]"
          />
        ))}
      </HorizontalScroll>
    </Section>
  );
}
