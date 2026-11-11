import { MailCheck, MailOpen } from 'lucide-react';
import { booleanCell, dateCell, titleCell, truncatedCell } from '@/components/data-table/cells';
import { BOOLEAN_OPTIONS, type ResourceConfig } from '@/components/resource/types';
import { formatDateTime } from '@/lib/format';
import type { ContactMessage } from '@/types';

export const messagesConfig: ResourceConfig<ContactMessage> = {
  path: 'contact',
  title: 'Messages',
  singular: 'message',
  description: 'Messages sent through the contact form on your website.',
  columns: [
    { key: 'name', header: 'From', sortable: true, cell: (row) => titleCell(row.name, row.email) },
    {
      key: 'subject',
      header: 'Message',
      cell: (row) => truncatedCell(row.subject ? `${row.subject}: ${row.message}` : row.message),
    },
    { key: 'isRead', header: 'Read', cell: (row) => booleanCell(row.isRead, ['Read', 'New']) },
    { key: 'repliedAt', header: 'Replied', cell: (row) => dateCell(row.repliedAt) },
    {
      key: 'createdAt',
      header: 'Received',
      sortable: true,
      cell: (row) => dateCell(row.createdAt),
    },
  ],
  filters: [{ name: 'isRead', label: 'Read', options: BOOLEAN_OPTIONS('Read', 'New') }],
  view: {
    title: (row) => row.subject ?? `Message from ${row.name}`,
    // Opening a message marks it as read.
    onOpen: (row, { update }) => {
      if (!row.isRead) void update(row.id, { isRead: true });
    },
    render: (row) => (
      <div className="space-y-4">
        <p className="text-muted">
          {row.name} &lt;
          <a href={`mailto:${row.email}`} className="text-accent-text hover:underline">
            {row.email}
          </a>
          &gt; · {formatDateTime(row.createdAt)}
        </p>
        <p className="whitespace-pre-wrap">{row.message}</p>
      </div>
    ),
  },
  actions: ({ update }) => [
    {
      label: 'Mark as replied',
      icon: MailCheck,
      hidden: (row) => Boolean(row.repliedAt),
      onSelect: (row) => void update(row.id, { isRead: true, replied: true }),
    },
    {
      label: 'Mark as unread',
      icon: MailOpen,
      hidden: (row) => !row.isRead,
      onSelect: (row) => void update(row.id, { isRead: false }),
    },
  ],
};
