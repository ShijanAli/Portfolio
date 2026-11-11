import { ArrowUpRight, Check, ChevronDown } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/layout/JsonLd';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { RichText } from '@/components/ui/RichText';
import { Container } from '@/components/ui/Section';
import { getBySlug, getList, getSettings } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { buildMetadata, buildServiceJsonLd } from '@/lib/seo';
import type { Service } from '@/lib/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return (await getList<Service>('services')).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [settings, service] = await Promise.all([
    getSettings(),
    getBySlug<Service>('services', slug),
  ]);
  if (!service) return {};

  return buildMetadata(settings, {
    title: service.title,
    description: service.shortDesc,
    path: `/services/${service.slug}`,
    image: service.coverImage,
    seo: service.seo,
  });
}

export default async function ServicePage({ params }: PageProps) {
  const { slug } = await params;
  const [settings, service] = await Promise.all([
    getSettings(),
    getBySlug<Service>('services', slug),
  ]);
  if (!service) notFound();

  return (
    <>
      <PageHeader
        compact
        eyebrow="Service"
        title={service.title}
        description={service.shortDesc}
        breadcrumbs={[{ label: 'Services', href: '/services' }]}
      />

      <Container className="pb-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
          <div className="min-w-0">
            {service.coverImage && (
              <div className="relative mb-12 aspect-[16/9] overflow-hidden rounded-3xl border border-border">
                <Image
                  src={service.coverImage}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1024px) 50rem, 100vw"
                  className="object-cover"
                />
              </div>
            )}
            {service.content && <RichText html={service.content} />}

            {service.faqs.length > 0 && (
              <section className="mt-20">
                <h2 className="mb-6 text-3xl font-semibold tracking-tight md:text-4xl">
                  Questions and answers
                </h2>
                <div className="divide-y divide-border border-y border-border">
                  {service.faqs.map((faq) => (
                    // Native disclosure: keyboard accessible and works without JavaScript.
                    <details key={faq.id} className="group py-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium [&::-webkit-details-marker]:hidden">
                        {faq.question}
                        <ChevronDown
                          className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
                          aria-hidden
                        />
                      </summary>
                      <p className="mt-3 max-w-2xl whitespace-pre-line text-muted">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <Card className="p-7">
              {service.startingPrice !== null && (
                <p className="text-sm text-muted">
                  Starting from
                  <span className="mt-1 block text-4xl font-semibold tracking-tight text-fg">
                    {formatPrice(service.startingPrice, service.currency)}
                  </span>
                </p>
              )}
              {service.features.length > 0 && (
                <ul className="mt-6 space-y-3">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check className="mt-1 size-4 shrink-0 text-accent-text" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
              <ButtonLink href={`/book?service=${service.slug}`} size="lg" className="mt-8 w-full">
                Book a free call
                <ArrowUpRight className="size-4" aria-hidden />
              </ButtonLink>
              <p className="mt-3 text-center text-sm text-muted">
                No commitment. We talk through your idea first.
              </p>
            </Card>
          </aside>
        </div>
      </Container>

      <JsonLd data={buildServiceJsonLd(settings, service)} />
    </>
  );
}
