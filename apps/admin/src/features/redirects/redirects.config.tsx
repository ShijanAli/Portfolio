import { activeCell } from '@/components/data-table/cells';
import { BOOLEAN_OPTIONS, type ResourceConfig } from '@/components/resource/types';
import type { Redirect } from '@/types';

const STATUS_CODES = [
  { value: '301', label: '301 Permanent' },
  { value: '302', label: '302 Temporary' },
  { value: '307', label: '307 Temporary (keeps method)' },
  { value: '308', label: '308 Permanent (keeps method)' },
];

export const redirectsConfig: ResourceConfig<Redirect> = {
  path: 'redirects',
  title: 'Redirects',
  singular: 'redirect',
  description: 'Send visitors and search engines from an old URL to a new one.',
  columns: [
    { key: 'fromPath', header: 'From', sortable: true, cell: (row) => <code>{row.fromPath}</code> },
    { key: 'toPath', header: 'To', cell: (row) => <code>{row.toPath}</code> },
    { key: 'statusCode', header: 'Type' },
    { key: 'hits', header: 'Hits', sortable: true },
    { key: 'isActive', header: 'Status', cell: (row) => activeCell(row.isActive) },
  ],
  filters: [{ name: 'isActive', label: 'Status', options: BOOLEAN_OPTIONS('Active', 'Disabled') }],
  fields: [
    {
      name: 'fromPath',
      label: 'From path',
      type: 'text',
      required: true,
      placeholder: '/old-page',
    },
    {
      name: 'toPath',
      label: 'To path or URL',
      type: 'text',
      required: true,
      placeholder: '/new-page',
    },
    {
      name: 'statusCode',
      label: 'Status code',
      type: 'select',
      required: true,
      options: STATUS_CODES,
      numeric: true,
      defaultValue: '301',
    },
    { name: 'isActive', label: 'Enabled', type: 'switch', defaultValue: true },
  ],
};
