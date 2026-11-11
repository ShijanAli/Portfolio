'use client';

import { useEffect, useMemo, useState } from 'react';
import { describeError, sendToApi } from '@/components/forms/useApiForm';
import { cn } from '@/lib/cn';

interface SlotResponse {
  timezone: string;
  slotDuration: number;
  slots: string[];
}

interface SlotPickerProps {
  /** Selected slot as an ISO instant, or null. */
  value: string | null;
  onChange: (slot: string) => void;
  /** Change this to load the slots again, e.g. after a slot turned out to be taken. */
  refreshKey?: number;
}

const DAYS_AHEAD = 30;

export const visitorTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const dayKey = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const weekday = new Intl.DateTimeFormat('en', { weekday: 'short' });
const dayOfMonth = new Intl.DateTimeFormat('en', { day: 'numeric' });
const monthName = new Intl.DateTimeFormat('en', { month: 'short' });
const fullDay = new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'long' });
const timeOfDay = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' });

export const formatSlot = (iso: string) =>
  `${fullDay.format(new Date(iso))} at ${timeOfDay.format(new Date(iso))}`;

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Pick a day, then a time. The API returns bookable instants; they are grouped and shown
 * in the visitor's own timezone, so "10:00" always means 10:00 where they are.
 */
export function SlotPicker({ value, onChange, refreshKey = 0 }: SlotPickerProps) {
  const [data, setData] = useState<SlotResponse | null>(null);
  const [error, setError] = useState('');
  const [day, setDay] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const from = new Date();
    const to = new Date(from.getTime() + DAYS_AHEAD * 24 * 60 * 60 * 1000);

    setData(null);
    setError('');
    sendToApi<SlotResponse>(
      `/bookings/slots?from=${isoDate(from)}&to=${isoDate(to)}`,
      undefined,
      'GET',
    )
      .then((result) => !cancelled && setData(result.data))
      .catch((reason: unknown) => !cancelled && setError(describeError(reason)));

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Slots grouped by the visitor's local calendar day, in order.
  const days = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const slot of data?.slots ?? []) {
      const key = dayKey.format(new Date(slot));
      groups.set(key, [...(groups.get(key) ?? []), slot]);
    }
    return [...groups.entries()];
  }, [data]);

  const activeDay = day && days.some(([key]) => key === day) ? day : (days[0]?.[0] ?? null);
  const times = days.find(([key]) => key === activeDay)?.[1] ?? [];

  if (error)
    return (
      <p role="alert" className="text-danger">
        {error}
      </p>
    );
  if (!data) return <p className="animate-pulse text-muted">Loading available times...</p>;
  if (days.length === 0) {
    return (
      <p className="text-muted">
        There are no free times in the next {DAYS_AHEAD} days. Please use the contact form instead.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-3 text-sm text-muted">
        {data.slotDuration}-minute video call. Times are shown in your timezone ({visitorTimezone()}
        ).
      </p>

      <div
        role="radiogroup"
        aria-label="Day"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-3"
      >
        {days.map(([key, slots]) => {
          const date = new Date(slots[0]!);
          const selected = key === activeDay;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${fullDay.format(date)}, ${slots.length} times available`}
              onClick={() => setDay(key)}
              className={cn(
                'flex w-16 shrink-0 cursor-pointer flex-col items-center rounded-2xl border py-3 transition-colors',
                selected ? 'border-accent bg-accent/15' : 'border-border hover:border-muted/60',
              )}
            >
              <span className="text-xs text-muted">{weekday.format(date)}</span>
              <span className="text-xl font-semibold">{dayOfMonth.format(date)}</span>
              <span className="text-xs text-muted">{monthName.format(date)}</span>
            </button>
          );
        })}
      </div>

      <div
        role="radiogroup"
        aria-label="Time"
        className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4"
      >
        {times.map((slot) => (
          <button
            key={slot}
            type="button"
            role="radio"
            aria-checked={slot === value}
            onClick={() => onChange(slot)}
            className={cn(
              'h-11 cursor-pointer rounded-xl border text-sm transition-colors',
              slot === value
                ? 'border-accent-solid bg-accent-solid text-accent-fg'
                : 'border-border hover:border-accent/60',
            )}
          >
            {timeOfDay.format(new Date(slot))}
          </button>
        ))}
      </div>
    </div>
  );
}
