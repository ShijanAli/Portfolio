import { CalendarCheck, CircleCheck, CircleX, UserX } from 'lucide-react';
import { statusCell, titleCell } from '@/components/data-table/cells';
import type { ResourceConfig } from '@/components/resource/types';
import { DetailList } from '@/components/ui/DetailList';
import { api } from '@/lib/api';
import { formatDateTime, humanize } from '@/lib/format';
import type { Booking } from '@/types';

const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map((value) => ({
  value,
  label: humanize(value),
}));

const TONES = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  COMPLETED: 'accent',
  CANCELLED: 'neutral',
  NO_SHOW: 'danger',
} as const;

const setStatus = (booking: Booking, status: string, details: object = {}) =>
  api.patch(`/bookings/${booking.id}/status`, { status, ...details });

const isActive = (booking: Booking) =>
  booking.status === 'PENDING' || booking.status === 'CONFIRMED';

export const bookingsConfig: ResourceConfig<Booking> = {
  path: 'bookings',
  title: 'Bookings',
  singular: 'booking',
  description: 'Calls booked through your website. Times are shown in your local time.',
  columns: [
    {
      key: 'name',
      header: 'Client',
      sortable: true,
      cell: (row) => titleCell(row.name, row.email),
    },
    { key: 'startAt', header: 'When', sortable: true, cell: (row) => formatDateTime(row.startAt) },
    { key: 'service', header: 'Service', cell: (row) => row.service?.title ?? '—' },
    { key: 'status', header: 'Status', cell: (row) => statusCell(row.status, TONES) },
    { key: 'code', header: 'Reference', cell: (row) => <code>{row.code}</code> },
  ],
  filters: [{ name: 'status', label: 'Status', options: STATUSES }],
  view: {
    title: (row) => `${row.name} · ${row.code}`,
    render: (row) => (
      <DetailList
        rows={[
          ['Status', statusCell(row.status, TONES)],
          ['When', formatDateTime(row.startAt)],
          ['Client timezone', row.clientTimezone],
          ['Email', row.email],
          ['Phone', row.phone],
          ['Company', row.company],
          ['Service', row.service?.title],
          ['Message', row.message],
          ['Meeting link', row.meetLink],
          ['Your note', row.adminNote],
          ['Cancel reason', row.cancelReason],
        ]}
      />
    ),
  },
  formActions: [
    {
      label: 'Confirm booking',
      icon: CalendarCheck,
      hidden: (row) => row.status !== 'PENDING',
      successMessage: 'Booking confirmed. The client has been emailed.',
      fields: [
        {
          name: 'meetLink',
          label: 'Meeting link',
          type: 'url',
          wide: true,
          placeholder: 'https://meet.google.com/...',
          help: 'Included in the confirmation email.',
        },
        { name: 'adminNote', label: 'Private note', type: 'textarea', wide: true },
      ],
      submit: (row, values) => setStatus(row, 'CONFIRMED', values),
    },
    {
      label: 'Cancel booking',
      icon: CircleX,
      danger: true,
      hidden: (row) => !isActive(row),
      successMessage: 'Booking cancelled. The client has been emailed.',
      fields: [
        {
          name: 'cancelReason',
          label: 'Reason',
          type: 'textarea',
          wide: true,
          help: 'Shown to the client in the cancellation email.',
        },
      ],
      submit: (row, values) => setStatus(row, 'CANCELLED', values),
    },
  ],
  actions: ({ run }) => [
    {
      label: 'Mark as completed',
      icon: CircleCheck,
      hidden: (row) => row.status !== 'CONFIRMED',
      onSelect: (row) => void run(() => setStatus(row, 'COMPLETED'), 'Marked as completed'),
    },
    {
      label: 'Mark as no-show',
      icon: UserX,
      hidden: (row) => row.status !== 'CONFIRMED',
      onSelect: (row) => void run(() => setStatus(row, 'NO_SHOW'), 'Marked as no-show'),
    },
  ],
};
