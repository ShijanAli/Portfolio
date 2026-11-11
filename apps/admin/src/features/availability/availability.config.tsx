import { activeCell, dateCell } from '@/components/data-table/cells';
import { BOOLEAN_OPTIONS, type ResourceConfig } from '@/components/resource/types';
import { Badge } from '@/components/ui/Badge';
import type { Availability, AvailabilityException } from '@/types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
  (label, index) => ({ value: String(index), label }),
);

export const availabilityConfig: ResourceConfig<Availability> = {
  path: 'availability',
  title: 'Working hours',
  singular: 'time window',
  description: 'When clients can book a call each week, in your booking timezone.',
  searchable: false,
  columns: [
    { key: 'dayOfWeek', header: 'Day', sortable: true, cell: (row) => DAYS[row.dayOfWeek]?.label },
    { key: 'startTime', header: 'From', sortable: true },
    { key: 'endTime', header: 'To' },
    { key: 'isActive', header: 'Status', cell: (row) => activeCell(row.isActive) },
  ],
  filters: [
    { name: 'dayOfWeek', label: 'Day', options: DAYS },
    { name: 'isActive', label: 'Status', options: BOOLEAN_OPTIONS('Active', 'Off') },
  ],
  fields: [
    {
      name: 'dayOfWeek',
      label: 'Day',
      type: 'select',
      required: true,
      numeric: true,
      options: DAYS,
      defaultValue: '1',
      wide: true,
    },
    { name: 'startTime', label: 'From', type: 'time', required: true, defaultValue: '10:00' },
    { name: 'endTime', label: 'To', type: 'time', required: true, defaultValue: '18:00' },
    { name: 'isActive', label: 'Active', type: 'switch', defaultValue: true },
  ],
};

export const availabilityExceptionsConfig: ResourceConfig<AvailabilityException> = {
  path: 'availability-exceptions',
  title: 'Days off and special hours',
  singular: 'exception',
  description: 'Holidays, or days with different hours than your normal week.',
  columns: [
    { key: 'date', header: 'Date', sortable: true, cell: (row) => dateCell(row.date) },
    {
      key: 'isOff',
      header: 'Type',
      cell: (row) =>
        row.isOff ? (
          <Badge tone="warning">Day off</Badge>
        ) : (
          <Badge tone="accent">Special hours</Badge>
        ),
    },
    {
      key: 'startTime',
      header: 'Hours',
      cell: (row) => (row.isOff || !row.startTime ? '—' : `${row.startTime} – ${row.endTime}`),
    },
    { key: 'note', header: 'Note', cell: (row) => row.note ?? '—' },
  ],
  fields: [
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'note', label: 'Note', type: 'text', placeholder: 'Eid holiday' },
    {
      name: 'isOff',
      label: 'Whole day off',
      type: 'switch',
      defaultValue: true,
      wide: true,
      help: 'Turn off to set special hours for this date instead.',
    },
    { name: 'startTime', label: 'Special hours from', type: 'time' },
    { name: 'endTime', label: 'Special hours to', type: 'time' },
  ],
};
