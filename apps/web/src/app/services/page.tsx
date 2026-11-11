import type { Metadata } from 'next';
import { BookingCta } from '@/components/sections/Closing';
import { ServiceCard } from '@/components/sections/Services';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Container } from '@/components/ui/Section';
import { getList, getPageSeo, getSettings } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import type { Service } from '@/lib/types';

const DESCRIPTION =
  'From a first idea to a product running in production: what I can build for you.';

export async function generateMetadata(): Promise<Metadata> {
  const [settings, seo] = await Promise.all([getSettings(), getPageSeo('services')]);
  return buildMetadata(settings, {
    title: 'Services',
    description: DESCRIPTION,
    path: '/services',
    seo,
  });
}

export default async function ServicesPage() {
  const [settings, services] = await Promise.all([
    getSettings(),
    getList<Service>('services', { sort: 'order', order: 'asc' }),
  ]);

  return (
    <>
      <PageHeader eyebrow="Services" title="How I can help" description={DESCRIPTION} />
      <Container className="pb-24">
        {services.length > 0 ? (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <li
                key={service.id}
                data-reveal
                style={{ '--reveal-delay': `${(index % 3) * 90}ms` } as React.CSSProperties}
              >
                <ServiceCard service={service} index={index} className="h-full" headingLevel="h2" />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Services are coming soon" />
        )}
      </Container>
      <BookingCta settings={settings} />
    </>
  );
}
