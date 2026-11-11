import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { About, type Stat } from '@/components/sections/About';
import { Blog } from '@/components/sections/Blog';
import { BookingCta, Contact, Newsletter } from '@/components/sections/Closing';
import { Experience } from '@/components/sections/Experience';
import { Hero } from '@/components/sections/Hero';
import { Projects } from '@/components/sections/Projects';
import { Services } from '@/components/sections/Services';
import { TechStack } from '@/components/sections/TechStack';
import { Testimonials } from '@/components/sections/Testimonials';
import { getList, getPageSeo, getSettings } from '@/lib/api';
import { yearsSince } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';
import type {
  Experience as ExperienceItem,
  Post,
  Project,
  SectionKey,
  Service,
  Technology,
  Testimonial,
} from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  const [settings, seo] = await Promise.all([getSettings(), getPageSeo('home')]);
  return buildMetadata(settings, { path: '/', seo });
}

/** Headline numbers, derived from the content itself so they never go stale. */
function statsOf(
  experiences: ExperienceItem[],
  projects: Project[],
  technologies: Technology[],
  testimonials: Testimonial[],
): Stat[] {
  const firstJob = experiences.map((item) => item.startDate).sort()[0];
  return [
    firstJob ? { value: `${yearsSince(firstJob)}+`, label: 'Years of experience' } : null,
    projects.length > 0 ? { value: `${projects.length}+`, label: 'Projects shipped' } : null,
    technologies.length > 0 ? { value: String(technologies.length), label: 'Technologies' } : null,
    testimonials.length > 0 ? { value: String(testimonials.length), label: 'Happy clients' } : null,
  ].filter((stat): stat is Stat => stat !== null);
}

export default async function HomePage() {
  const [settings, projects, services, experiences, technologies, posts, testimonials] =
    await Promise.all([
      getSettings(),
      getList<Project>('projects', { sort: 'order', order: 'asc', limit: 6 }),
      getList<Service>('services', { sort: 'order', order: 'asc' }),
      getList<ExperienceItem>('experiences'),
      getList<Technology>('technologies', { sort: 'order', order: 'asc' }),
      getList<Post>('blogs', { sort: 'publishedAt', order: 'desc', limit: 3 }),
      getList<Testimonial>('testimonials', { sort: 'order', order: 'asc', limit: 6 }),
    ]);

  // Which component renders each section key. Order and visibility come from the admin.
  const sections: Record<SectionKey, ReactNode> = {
    hero: <Hero settings={settings} />,
    about: (
      <About
        settings={settings}
        stats={statsOf(experiences, projects, technologies, testimonials)}
      />
    ),
    services: <Services services={services} />,
    projects: <Projects projects={projects} />,
    experience: <Experience experiences={experiences} />,
    techStack: <TechStack technologies={technologies} />,
    blog: <Blog posts={posts} />,
    testimonials: <Testimonials testimonials={testimonials} />,
    newsletter: <Newsletter />,
    booking: <BookingCta settings={settings} />,
    contact: <Contact settings={settings} />,
  };

  return settings.sections.items
    .filter((item) => item.enabled)
    .map((item) => <div key={item.key}>{sections[item.key]}</div>);
}
