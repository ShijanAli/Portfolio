import { activeCell, booleanCell, statusCell, titleCell } from '@/components/data-table/cells';
import { activeField, featuredField, orderField, slugField } from '@/components/form/common-fields';
import { BOOLEAN_OPTIONS, type ResourceConfig } from '@/components/resource/types';
import { humanize } from '@/lib/format';
import type { Technology } from '@/types';

const CATEGORIES = ['FRONTEND', 'BACKEND', 'DATABASE', 'DEVOPS', 'MOBILE', 'TOOL', 'OTHER'].map(
  (value) => ({ value, label: humanize(value) }),
);

export const technologiesConfig: ResourceConfig<Technology> = {
  path: 'technologies',
  title: 'Technologies',
  singular: 'technology',
  description: 'Your tech stack. Also used to tag projects.',
  columns: [
    { key: 'name', header: 'Name', sortable: true, cell: (row) => titleCell(row.name, row.slug) },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      cell: (row) => statusCell(row.category),
    },
    {
      key: 'proficiency',
      header: 'Proficiency',
      cell: (row) => (row.proficiency === null ? '—' : `${row.proficiency}%`),
    },
    { key: 'order', header: 'Order', sortable: true },
    { key: 'isFeatured', header: 'Featured', cell: (row) => booleanCell(row.isFeatured) },
    { key: 'isActive', header: 'Status', cell: (row) => activeCell(row.isActive) },
  ],
  filters: [
    { name: 'category', label: 'Category', options: CATEGORIES },
    { name: 'isActive', label: 'Status', options: BOOLEAN_OPTIONS('Active', 'Hidden') },
  ],
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Next.js' },
    slugField,
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      options: CATEGORIES,
      defaultValue: 'FRONTEND',
    },
    { name: 'proficiency', label: 'Proficiency (%)', type: 'number', min: 0, max: 100 },
    { name: 'icon', label: 'Icon', type: 'image', wide: true },
    orderField,
    featuredField,
    activeField,
  ],
};
