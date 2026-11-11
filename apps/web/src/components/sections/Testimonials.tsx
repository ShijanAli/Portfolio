import { Star } from 'lucide-react';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Container, Section, SectionHeading } from '@/components/ui/Section';
import type { Testimonial } from '@/lib/types';

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <Section id="testimonials">
      <Container>
        <SectionHeading eyebrow="Testimonials" title="What clients say" />
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <li
              key={testimonial.id}
              data-reveal
              style={{ '--reveal-delay': `${(index % 3) * 90}ms` } as React.CSSProperties}
            >
              <Card className="flex h-full flex-col p-8">
                <p
                  className="flex gap-1"
                  role="img"
                  aria-label={`Rated ${testimonial.rating} out of 5`}
                >
                  {Array.from({ length: 5 }, (_, star) => (
                    <Star
                      key={star}
                      className={
                        star < testimonial.rating
                          ? 'size-4 fill-accent text-accent-text'
                          : 'size-4 text-border'
                      }
                      aria-hidden
                    />
                  ))}
                </p>
                <blockquote className="mt-5 flex-1 text-lg text-pretty text-fg/90">
                  “{testimonial.message}”
                </blockquote>
                <footer className="mt-8 flex items-center gap-3">
                  {testimonial.avatar ? (
                    <Image
                      src={testimonial.avatar}
                      alt=""
                      width={44}
                      height={44}
                      className="size-11 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="grid size-11 place-items-center rounded-full bg-accent/20 text-sm font-semibold"
                    >
                      {initialsOf(testimonial.name)}
                    </span>
                  )}
                  <div>
                    <cite className="font-medium not-italic">{testimonial.name}</cite>
                    <p className="text-sm text-muted">
                      {[testimonial.role, testimonial.company].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </footer>
              </Card>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
