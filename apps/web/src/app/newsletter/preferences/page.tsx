import type { Metadata } from 'next';
import { NewsletterPreferences } from '@/components/forms/NewsletterPreferences';
import { PageHeader } from '@/components/ui/PageHeader';
import { Container } from '@/components/ui/Section';

export const metadata: Metadata = {
  title: 'Email preferences',
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
      <PageHeader compact eyebrow="Newsletter" title="Email preferences" />
      <Container className="max-w-2xl pb-28">
        <NewsletterPreferences token={token} />
      </Container>
    </>
  );
}
