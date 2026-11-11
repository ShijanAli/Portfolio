'use client';

import { ArrowLeft, ArrowRight, CalendarCheck } from 'lucide-react';
import { useState } from 'react';
import {
  FormMessage,
  Honeypot,
  SelectField,
  TextAreaField,
  TextField,
} from '@/components/forms/fields';
import { useApiForm } from '@/components/forms/useApiForm';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { trackEvent } from '@/lib/analytics';
import { formatSlot, SlotPicker, visitorTimezone } from './SlotPicker';

export interface BookingResult {
  code: string;
  startAt: string;
  status: string;
  manageToken: string;
}

interface BookingWizardProps {
  services: { id: string; title: string }[];
  /** Service chosen on the page the visitor came from, if any. */
  initialServiceId?: string;
}

function Confirmation({ booking }: { booking: BookingResult }) {
  const confirmed = booking.status === 'CONFIRMED';

  return (
    <Card className="p-8 text-center md:p-12">
      <CalendarCheck className="mx-auto size-12 text-accent-text" aria-hidden />
      <h2 className="mt-5 text-3xl font-semibold tracking-tight">
        {confirmed ? 'Your call is booked' : 'Request received'}
      </h2>
      <p className="mt-3 text-lg">{formatSlot(booking.startAt)}</p>
      <p className="mx-auto mt-3 max-w-md text-muted">
        {confirmed
          ? 'A confirmation email is on its way.'
          : 'I will confirm the time by email shortly. You have been sent a copy of the details.'}{' '}
        Your reference is <span className="font-mono text-fg">{booking.code}</span>.
      </p>
      <ButtonLink href={`/book/manage/${booking.manageToken}`} variant="secondary" className="mt-8">
        Manage this booking
      </ButtonLink>
    </Card>
  );
}

/** Two steps: pick a time, then leave your details. */
export function BookingWizard({ services, initialServiceId }: BookingWizardProps) {
  const [slot, setSlot] = useState<string | null>(null);
  const [step, setStep] = useState<'time' | 'details'>('time');
  const [refreshKey, setRefreshKey] = useState(0);

  const form = useApiForm<BookingResult>('/bookings', {
    successMessage: 'Booked',
    extra: { startAt: slot, clientTimezone: visitorTimezone() },
    onSuccess: () => trackEvent('booking_completed'),
    // Someone else took the slot in the meantime: go back and show fresh times.
    onError: (error) => {
      if (error.status !== 409) return;
      setSlot(null);
      setStep('time');
      setRefreshKey((key) => key + 1);
    },
  });

  if (form.data) return <Confirmation booking={form.data} />;

  return (
    <Card className="p-6 md:p-10">
      <ol className="mb-8 flex gap-6 text-sm" aria-label="Steps">
        {['Choose a time', 'Your details'].map((label, index) => {
          const current = (step === 'time' ? 0 : 1) === index;
          return (
            <li
              key={label}
              aria-current={current ? 'step' : undefined}
              className={current ? 'text-fg' : 'text-muted'}
            >
              <span className="mr-2 font-mono text-accent-text">{index + 1}</span>
              {label}
            </li>
          );
        })}
      </ol>

      {step === 'time' ? (
        <>
          {/* Height is reserved so the page does not jump when the times arrive. */}
          <div className="min-h-80">
            <SlotPicker value={slot} onChange={setSlot} refreshKey={refreshKey} />
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <FormMessage status={form.status} message={form.message} />
            <Button
              size="lg"
              className="ml-auto"
              disabled={!slot}
              onClick={() => setStep('details')}
            >
              Continue
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        </>
      ) : (
        <form onSubmit={form.onSubmit} noValidate className="relative space-y-5">
          <Honeypot />
          <p className="rounded-2xl border border-border bg-raised px-4 py-3">
            <span className="text-muted">Selected time: </span>
            {slot && formatSlot(slot)}
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Your name"
              name="name"
              required
              autoComplete="name"
              error={form.fieldErrors.name}
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              required
              autoComplete="email"
              error={form.fieldErrors.email}
            />
            <TextField
              label="Phone (optional)"
              name="phone"
              type="tel"
              autoComplete="tel"
              error={form.fieldErrors.phone}
            />
            <TextField
              label="Company (optional)"
              name="company"
              autoComplete="organization"
              error={form.fieldErrors.company}
            />
          </div>
          {services.length > 0 && (
            <SelectField
              label="What do you need help with?"
              name="serviceId"
              defaultValue={initialServiceId ?? ''}
              placeholder="Not sure yet"
              options={services.map((service) => ({ value: service.id, label: service.title }))}
              error={form.fieldErrors.serviceId}
            />
          )}
          <TextAreaField
            label="Anything I should know before the call? (optional)"
            name="message"
            rows={4}
            error={form.fieldErrors.message}
          />
          <FormMessage status={form.status} message={form.message} />
          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="secondary" size="lg" onClick={() => setStep('time')}>
              <ArrowLeft className="size-4" aria-hidden />
              Change time
            </Button>
            <Button type="submit" size="lg" disabled={form.isSubmitting}>
              {form.isSubmitting ? 'Booking...' : 'Book the call'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
