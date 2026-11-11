'use client';

import { useEffect, useState } from 'react';
import { describeError, sendToApi } from '@/components/forms/useApiForm';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatSlot, SlotPicker } from './SlotPicker';

interface Booking {
  code: string;
  name: string;
  startAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  meetLink: string | null;
}

const STATUS_TEXT: Record<Booking['status'], string> = {
  PENDING: 'Waiting for confirmation',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'Missed',
};

type Mode = 'view' | 'reschedule' | 'cancel';

/** Lets a client see, move or cancel their own booking, using the secret link from their email. */
export function BookingManager({ token }: { token: string }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [mode, setMode] = useState<Mode>('view');
  const [slot, setSlot] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const path = `/bookings/manage/${encodeURIComponent(token)}`;

  useEffect(() => {
    sendToApi<Booking>(path, undefined, 'GET')
      .then((result) => setBooking(result.data))
      .catch((error: unknown) => setMessage(describeError(error)));
  }, [path]);

  /** Runs a change, then shows the updated booking. */
  const change = async (action: 'cancel' | 'reschedule', body: object, done: string) => {
    setBusy(true);
    setMessage('');
    try {
      setBooking((await sendToApi<Booking>(`${path}/${action}`, body)).data);
      setMode('view');
      setSlot(null);
      setMessage(done);
    } catch (error) {
      setMessage(describeError(error));
    } finally {
      setBusy(false);
    }
  };

  if (!booking) {
    return (
      <Card className="p-8 text-center">
        <p
          className={message ? 'text-danger' : 'animate-pulse text-muted'}
          role={message ? 'alert' : undefined}
        >
          {message || 'Loading your booking...'}
        </p>
        {message && (
          <ButtonLink href="/book" className="mt-6">
            Book a new call
          </ButtonLink>
        )}
      </Card>
    );
  }

  const canChange =
    (booking.status === 'PENDING' || booking.status === 'CONFIRMED') &&
    new Date(booking.startAt) > new Date();

  return (
    <Card className="p-6 md:p-10">
      <p className="font-mono text-sm text-muted">Reference {booking.code}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">{formatSlot(booking.startAt)}</h2>
      <p className="mt-2 text-lg text-accent-text">{STATUS_TEXT[booking.status]}</p>
      {booking.meetLink && booking.status === 'CONFIRMED' && (
        <ButtonLink href={booking.meetLink} className="mt-6">
          Join the call
        </ButtonLink>
      )}
      {message && (
        <p role="status" className="mt-6 rounded-2xl border border-border bg-raised px-4 py-3">
          {message}
        </p>
      )}

      {canChange && mode === 'view' && (
        <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-8">
          <Button variant="secondary" onClick={() => setMode('reschedule')}>
            Pick another time
          </Button>
          <Button variant="ghost" onClick={() => setMode('cancel')}>
            Cancel booking
          </Button>
        </div>
      )}

      {mode === 'reschedule' && (
        <div className="mt-8 border-t border-border pt-8">
          <h3 className="mb-4 text-xl font-medium">Choose a new time</h3>
          <SlotPicker value={slot} onChange={setSlot} />
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              disabled={!slot || busy}
              onClick={() =>
                void change('reschedule', { startAt: slot }, 'Your booking has been moved.')
              }
            >
              {busy ? 'Saving...' : 'Confirm new time'}
            </Button>
            <Button variant="ghost" onClick={() => setMode('view')}>
              Keep the current time
            </Button>
          </div>
        </div>
      )}

      {mode === 'cancel' && (
        <div className="mt-8 border-t border-border pt-8">
          <h3 className="text-xl font-medium">Cancel this booking?</h3>
          <p className="mt-2 text-muted">The time will be released for someone else.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              disabled={busy}
              onClick={() => void change('cancel', {}, 'Your booking has been cancelled.')}
            >
              {busy ? 'Cancelling...' : 'Yes, cancel it'}
            </Button>
            <Button variant="ghost" onClick={() => setMode('view')}>
              Keep my booking
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
