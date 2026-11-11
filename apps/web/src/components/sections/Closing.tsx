import { ArrowUpRight, Mail, MapPin } from 'lucide-react';
import { ContactForm } from '@/components/forms/ContactForm';
import { NewsletterForm } from '@/components/forms/NewsletterForm';
import { Magnetic } from '@/components/motion/Pointer';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container, Section, SectionHeading } from '@/components/ui/Section';
import type { SiteSettings } from '@/lib/types';

export function Newsletter() {
  return (
    <Section id="newsletter" className="py-16 md:py-24">
      <Container>
        <Card data-reveal className="p-8 md:p-14">
          <div aria-hidden className="glow absolute -top-24 -right-24 size-80 opacity-50" />
          <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="font-mono text-xs tracking-[0.2em] text-accent-text uppercase">
                Newsletter
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance md:text-5xl">
                New articles and projects, in your inbox
              </h2>
              <p className="mt-4 text-muted">No spam. Unsubscribe with one click, any time.</p>
            </div>
            <NewsletterForm source="section" />
          </div>
        </Card>
      </Container>
    </Section>
  );
}

export function BookingCta({ settings }: { settings: SiteSettings }) {
  const { primaryCta } = settings.hero;

  return (
    <Section id="booking" className="overflow-hidden text-center">
      <div
        aria-hidden
        className="glow absolute top-1/2 left-1/2 size-[60vmin] -translate-x-1/2 -translate-y-1/2 opacity-40"
      />
      <Container className="relative">
        <p data-reveal className="font-mono text-xs tracking-[0.2em] text-accent-text uppercase">
          Have a project in mind?
        </p>
        <SplitHeading
          text="Let’s build it together"
          className="mx-auto mt-6 max-w-5xl text-[clamp(2.75rem,9vw,8rem)] leading-[0.95] font-semibold tracking-[-0.04em] text-balance"
        />
        <p data-reveal className="mx-auto mt-6 max-w-xl text-lg text-muted">
          Book a free call. We will talk through your idea, the scope and a realistic timeline.
        </p>
        <div data-reveal className="mt-10">
          <Magnetic strength={0.4}>
            <ButtonLink href={primaryCta.href || '/book'} size="lg" className="h-16 px-10 text-lg">
              {primaryCta.label || 'Book a call'}
              <ArrowUpRight className="size-5" aria-hidden />
            </ButtonLink>
          </Magnetic>
        </div>
      </Container>
    </Section>
  );
}

export function Contact({ settings }: { settings: SiteSettings }) {
  const { email, location } = settings.general;

  return (
    <Section id="contact">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <SectionHeading
              eyebrow="Contact"
              title="Say hello"
              description="Prefer writing? Send a message and I will reply within a day or two."
            />
            <ul className="space-y-4 text-lg">
              {email && (
                <li data-reveal className="flex items-center gap-3">
                  <Mail className="size-5 text-accent-text" aria-hidden />
                  <a href={`mailto:${email}`} className="hover:text-accent-text">
                    {email}
                  </a>
                </li>
              )}
              {location && (
                <li data-reveal className="flex items-center gap-3">
                  <MapPin className="size-5 text-accent-text" aria-hidden />
                  {location}
                </li>
              )}
            </ul>
          </div>
          <Card data-reveal className="p-7 md:p-10">
            <ContactForm />
          </Card>
        </div>
      </Container>
    </Section>
  );
}
