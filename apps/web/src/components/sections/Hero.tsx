import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { Magnetic } from '@/components/motion/Pointer';
import { RotatingText } from '@/components/motion/RotatingText';
import { RecedeOnScroll } from '@/components/motion/ScrollFx';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { HeroVisual } from '@/components/three/HeroVisual';
import { ButtonLink } from '@/components/ui/Button';
import { Portrait } from '@/components/ui/Portrait';
import { Container } from '@/components/ui/Section';
import { cn } from '@/lib/cn';
import type { SiteSettings } from '@/lib/types';

export function Hero({ settings }: { settings: SiteSettings }) {
  const { hero, general, theme } = settings;
  const name = general.ownerName || general.siteName;
  const headline = hero.headline || general.tagline;

  return (
    <section id="hero" className="relative flex min-h-svh items-center overflow-hidden pt-28 pb-20">
      <HeroVisual accentColor={theme.accentColor} />

      <RecedeOnScroll className="relative w-full">
        {/* With a hero image the text shares the row with it on large screens. */}
        <Container
          className={
            hero.image
              ? 'grid items-center gap-12 lg:grid-cols-[1fr_22rem] xl:grid-cols-[1fr_26rem]'
              : undefined
          }
        >
          <div className="min-w-0">
            {general.availableForWork && (
              <p
                data-reveal="load"
                className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-sm text-muted backdrop-blur"
              >
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-success" />
                </span>
                Available for new projects
              </p>
            )}

            <p data-reveal="load" className="mb-3 text-lg text-muted md:text-xl">
              {hero.greeting}
            </p>
            <SplitHeading
              as="h1"
              immediate
              text={name}
              delay={100}
              className={cn(
                'text-gradient leading-[0.92] font-semibold tracking-[-0.045em]',
                hero.image ? 'text-[clamp(3rem,7.5vw,7rem)]' : 'text-[clamp(3rem,10.5vw,9.5rem)]',
              )}
            />

            {hero.roles.length > 0 && (
              <p
                data-reveal="load"
                style={{ '--reveal-delay': '350ms' } as React.CSSProperties}
                className="mt-6 text-2xl font-medium tracking-tight md:text-4xl"
              >
                <RotatingText items={hero.roles} className="text-accent-text" />
              </p>
            )}

            <div
              data-reveal="load"
              style={{ '--reveal-delay': '450ms' } as React.CSSProperties}
              className="mt-8 grid gap-8 md:grid-cols-[1fr_auto] md:items-end"
            >
              <div className="max-w-xl">
                {headline && (
                  <p className="text-xl text-pretty text-fg/90 md:text-2xl">{headline}</p>
                )}
                {hero.subheadline && (
                  <p className="mt-3 text-pretty text-muted">{hero.subheadline}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {hero.primaryCta.label && (
                  <Magnetic>
                    <ButtonLink href={hero.primaryCta.href || '/'} size="lg">
                      {hero.primaryCta.label}
                      <ArrowUpRight className="size-4" aria-hidden />
                    </ButtonLink>
                  </Magnetic>
                )}
                {hero.secondaryCta.label && (
                  <ButtonLink href={hero.secondaryCta.href || '/'} size="lg" variant="secondary">
                    {hero.secondaryCta.label}
                  </ButtonLink>
                )}
              </div>
            </div>
          </div>

          {hero.image && (
            <div
              data-reveal="load"
              style={{ '--reveal-delay': '300ms' } as React.CSSProperties}
              className="mx-auto w-full max-w-xs lg:max-w-none"
            >
              <Portrait
                src={hero.image}
                alt={`Portrait of ${name}`}
                priority
                sizes="(min-width: 1280px) 26rem, (min-width: 1024px) 22rem, 20rem"
              />
            </div>
          )}
        </Container>
      </RecedeOnScroll>

      <a
        href="#about"
        aria-label="Scroll to content"
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 animate-float text-muted hover:text-fg md:block"
      >
        <ArrowDown className="size-5" />
      </a>
    </section>
  );
}
