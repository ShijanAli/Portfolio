import { ScrubText } from '@/components/motion/ScrubText';
import { Portrait } from '@/components/ui/Portrait';
import { Container, Section } from '@/components/ui/Section';
import { cn } from '@/lib/cn';
import type { SiteSettings } from '@/lib/types';

export interface Stat {
  value: string;
  label: string;
}

export function About({ settings, stats }: { settings: SiteSettings; stats: Stat[] }) {
  const { bio, location, avatar, ownerName, siteName } = settings.general;
  if (!bio) return null;

  return (
    <Section id="about">
      <Container>
        <p
          data-reveal
          className="mb-8 flex items-center gap-3 font-mono text-xs tracking-[0.2em] text-accent-text uppercase"
        >
          <span className="h-px w-8 bg-accent" aria-hidden />
          About
        </p>
        <h2 className="sr-only">About</h2>
        <div className={cn(avatar && 'grid gap-12 lg:grid-cols-[20rem_1fr] lg:gap-16')}>
          {avatar && (
            <div
              data-reveal
              className="mx-auto w-full max-w-xs lg:sticky lg:top-28 lg:max-w-none lg:self-start"
            >
              <Portrait
                src={avatar}
                alt={`Photo of ${ownerName || siteName}`}
                sizes="(min-width: 1024px) 20rem, 20rem"
              />
            </div>
          )}
          <ScrubText
            text={bio}
            className={cn(
              'leading-[1.25] font-medium tracking-tight text-balance',
              avatar ? 'text-2xl md:text-4xl' : 'max-w-5xl text-3xl md:text-5xl md:leading-[1.2]',
            )}
          />
        </div>

        {stats.length > 0 && (
          <dl className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-border pt-10 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                data-reveal
                style={{ '--reveal-delay': `${index * 80}ms` } as React.CSSProperties}
              >
                <dt className="text-sm text-muted">{stat.label}</dt>
                <dd className="mt-1 text-4xl font-semibold tracking-tight md:text-5xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {location && (
          <p data-reveal className="mt-10 text-muted">
            Based in {location}, working with clients worldwide.
          </p>
        )}
      </Container>
    </Section>
  );
}
