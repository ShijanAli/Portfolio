import type { Metadata } from 'next';
import { NewsletterAction } from '@/components/forms/NewsletterAction';
import { PageHeader } from '@/components/ui/PageHeader';
import { Container } from '@/components/ui/Section';

export const metadata: Metadata = {
  title: 'Confirm your subscription',
  robots: { index: false, follow: false },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <>
      <PageHeader compact eyebrow="Newsletter" title="Confirm your subscription" />
      <Container className="max-w-2xl pb-28">
        <NewsletterAction action="confirm" token={token} />
      </Container>
    </>
  );
}
