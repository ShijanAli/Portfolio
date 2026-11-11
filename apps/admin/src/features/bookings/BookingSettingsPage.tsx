import type { FieldConfig } from '@/components/form/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { SettingsForm } from '@/components/resource/SettingsForm';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';

const FIELDS: FieldConfig[] = [
  {
    name: 'timezone',
    label: 'Your timezone',
    type: 'text',
    required: true,
    placeholder: 'Asia/Dhaka',
    help: 'Working hours are entered in this timezone. Clients see slots in their own.',
  },
  {
    name: 'slotDuration',
    label: 'Call length (minutes)',
    type: 'number',
    required: true,
    min: 10,
    max: 240,
  },
  {
    name: 'bufferTime',
    label: 'Break between calls (minutes)',
    type: 'number',
    required: true,
    min: 0,
    max: 120,
  },
  {
    name: 'minNoticeHours',
    label: 'Minimum notice (hours)',
    type: 'number',
    required: true,
    min: 0,
    help: 'How far ahead a call must be booked.',
  },
  {
    name: 'maxDaysAhead',
    label: 'Bookable days ahead',
    type: 'number',
    required: true,
    min: 1,
    max: 365,
  },
  {
    name: 'maxPerDay',
    label: 'Maximum calls per day',
    type: 'number',
    required: true,
    min: 1,
    max: 50,
  },
  {
    name: 'autoConfirm',
    label: 'Confirm bookings automatically',
    type: 'switch',
    help: 'Otherwise each request waits for you to confirm it.',
  },
];

export function BookingSettingsPage() {
  return (
    <>
      <PageHeader
        title="Booking settings"
        description="How and when clients can book a call with you."
      />
      <Card className="max-w-3xl p-5">
        <SettingsForm
          queryKey={['bookings', 'settings']}
          load={() => api.get<object>('/bookings/settings')}
          save={(body) => api.put('/bookings/settings', body)}
          fields={FIELDS}
        />
      </Card>
    </>
  );
}
