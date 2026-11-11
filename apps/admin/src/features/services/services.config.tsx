import { statusCell, titleCell } from '@/components/data-table/cells';
import {
  CONTENT_STATUSES,
  orderField,
  seoFields,
  slugField,
  statusField,
} from '@/components/form/common-fields';
import type { ResourceConfig } from '@/components/resource/types';
import { STATUS_TONES } from '@/features/projects/projects.config';
import type { Service } from '@/types';

export const servicesConfig: ResourceConfig<Service> = {
  path: 'services',
  title: 'Services',
  singular: 'service',
  description: 'What clients can hire you for.',
  formLayout: 'page',
  columns: [
    {
      key: 'title',
      header: 'Service',
      sortable: true,
      cell: (row) => titleCell(row.title, row.shortDesc),
    },
    {
      key: 'startingPrice',
      header: 'Starting price',
      cell: (row) =>
        row.startingPrice === null ? '—' : `${row.currency} ${Number(row.startingPrice)}`,
    },
    { key: 'faqs', header: 'FAQs', cell: (row) => row.faqs.length },
    { key: 'status', header: 'Status', cell: (row) => statusCell(row.status, STATUS_TONES) },
    { key: 'order', header: 'Order', sortable: true },
  ],
  filters: [{ name: 'status', label: 'Status', options: CONTENT_STATUSES }],
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      placeholder: 'Web application development',
    },
    { ...slugField, placeholder: 'Generated from the title' },
    { name: 'shortDesc', label: 'Short description', type: 'textarea', required: true, wide: true },
    statusField,
    orderField,
    {
      name: 'startingPrice',
      label: 'Starting price',
      type: 'number',
      min: 0,
      help: 'Leave empty to hide the price.',
    },
    { name: 'currency', label: 'Currency', type: 'text', defaultValue: 'USD', placeholder: 'USD' },
    { name: 'coverImage', label: 'Cover image', type: 'image' },
    {
      name: 'icon',
      label: 'Icon name',
      type: 'text',
      placeholder: 'code',
      help: 'Icon shown on the service card.',
    },
    {
      name: 'features',
      label: 'What is included',
      type: 'tags',
      wide: true,
      placeholder: 'A feature, then Enter',
    },
    { name: 'content', label: 'Full description', type: 'richtext' },
    {
      name: 'faqs',
      label: 'Frequently asked questions',
      type: 'repeater',
      section: 'FAQ',
      placeholder: 'Add question',
      itemFields: [
        { name: 'question', label: 'Question' },
        { name: 'answer', label: 'Answer', multiline: true },
      ],
      // The API returns ids and ordering with each FAQ; the form only edits the text.
      from: (service: Service) =>
        service.faqs.map(({ question, answer }) => ({ question, answer })),
    },
    ...seoFields,
  ],
};
