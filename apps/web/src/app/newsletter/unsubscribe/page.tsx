import type { Metadata } from 'next';
import { NewsletterAction } from '@/components/forms/NewsletterAction';
import { PageHeader } from '@/components/ui/PageHeader';
import { Container } from '@/components/ui/Section';

export const metadata: Metadata = { title: 'Unsubscribe', robots: { index: false, follow: false } };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <>
      <PageHeader compact eyebrow="Newsletter" title="Unsubscribe" />
      <Container className="max-w-2xl pb-28">
        <NewsletterAction action="unsubscribe" token={token} />
      </Container>
    </>
  );
}
