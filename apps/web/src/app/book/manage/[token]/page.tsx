import type { Metadata } from 'next';
import { BookingManager } from '@/components/booking/BookingManager';
import { PageHeader } from '@/components/ui/PageHeader';
import { Container } from '@/components/ui/Section';

// A private page reached through a secret link: never indexed.
export const metadata: Metadata = {
  title: 'Your booking',
  robots: { index: false, follow: false },
};

export default async function ManageBookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <>
      <PageHeader
        compact
        title="Your booking"
        description="See the details, move it to another time, or cancel."
      />
      <Container className="max-w-3xl pb-28">
        <BookingManager token={token} />
      </Container>
    </>
  );
}
