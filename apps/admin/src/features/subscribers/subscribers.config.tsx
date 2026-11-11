import { UserMinus } from 'lucide-react';
import { dateCell, statusCell, titleCell } from '@/components/data-table/cells';
import type { ResourceConfig } from '@/components/resource/types';
import { humanize } from '@/lib/format';
import type { Subscriber } from '@/types';

const STATUSES = ['PENDING', 'CONFIRMED', 'UNSUBSCRIBED', 'BOUNCED'].map((value) => ({
  value,
  label: humanize(value),
}));

export const subscribersConfig: ResourceConfig<Subscriber> = {
  path: 'subscribers',
  title: 'Subscribers',
  singular: 'subscriber',
  description: 'People who joined your newsletter. They subscribe and confirm on the website.',
  columns: [
    {
      key: 'email',
      header: 'Subscriber',
      sortable: true,
      cell: (row) => titleCell(row.email, row.name),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) =>
        statusCell(row.status, {
          CONFIRMED: 'success',
          PENDING: 'warning',
          UNSUBSCRIBED: 'neutral',
          BOUNCED: 'danger',
        }),
    },
    {
      key: 'topics',
      header: 'Topics',
      cell: (row) => (row.topics.length ? row.topics.join(', ') : 'All'),
    },
    { key: 'source', header: 'Source', cell: (row) => row.source ?? '—' },
    { key: 'createdAt', header: 'Joined', sortable: true, cell: (row) => dateCell(row.createdAt) },
  ],
  filters: [{ name: 'status', label: 'Status', options: STATUSES }],
  actions: ({ update }) => [
    {
      label: 'Unsubscribe',
      icon: UserMinus,
      hidden: (row) => row.status !== 'CONFIRMED' && row.status !== 'PENDING',
      onSelect: (row) => void update(row.id, { status: 'UNSUBSCRIBED' }),
    },
  ],
};
