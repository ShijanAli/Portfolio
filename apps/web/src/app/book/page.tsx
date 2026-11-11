import type { Metadata } from 'next';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Container } from '@/components/ui/Section';
import { getList, getPageSeo, getSettings } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import type { Service } from '@/lib/types';

const DESCRIPTION =
  'Pick a time for a free video call. We will talk through your idea, the scope and a realistic timeline.';

interface PageProps {
  searchParams: Promise<{ service?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const [settings, seo] = await Promise.all([getSettings(), getPageSeo('book')]);
  return buildMetadata(settings, {
    title: 'Book a call',
    description: DESCRIPTION,
    path: '/book',
    seo,
  });
}

export default async function BookPage({ searchParams }: PageProps) {
  const { service } = await searchParams;
  const services = await getList<Service>('services', { sort: 'order', order: 'asc' });

  return (
    <>
      <PageHeader
        compact
        eyebrow="Free consultation"
        title="Book a call"
        description={DESCRIPTION}
      />
      <Container className="max-w-3xl pb-28">
        <BookingWizard
          services={services.map(({ id, title }) => ({ id, title }))}
          initialServiceId={services.find((item) => item.slug === service)?.id}
        />
      </Container>
    </>
  );
}
