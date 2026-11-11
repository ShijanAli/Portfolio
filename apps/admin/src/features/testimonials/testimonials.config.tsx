import { activeCell, booleanCell, titleCell, truncatedCell } from '@/components/data-table/cells';
import { activeField, featuredField, orderField } from '@/components/form/common-fields';
import { BOOLEAN_OPTIONS, type ResourceConfig } from '@/components/resource/types';
import type { Testimonial } from '@/types';

export const testimonialsConfig: ResourceConfig<Testimonial> = {
  path: 'testimonials',
  title: 'Testimonials',
  singular: 'testimonial',
  description: 'What clients say about working with you.',
  columns: [
    {
      key: 'name',
      header: 'Client',
      sortable: true,
      cell: (row) => titleCell(row.name, [row.role, row.company].filter(Boolean).join(', ')),
    },
    { key: 'message', header: 'Message', cell: (row) => truncatedCell(row.message) },
    { key: 'rating', header: 'Rating', sortable: true, cell: (row) => `${row.rating} / 5` },
    { key: 'isFeatured', header: 'Featured', cell: (row) => booleanCell(row.isFeatured) },
    { key: 'isActive', header: 'Status', cell: (row) => activeCell(row.isActive) },
  ],
  filters: [
    { name: 'isActive', label: 'Status', options: BOOLEAN_OPTIONS('Active', 'Hidden') },
    { name: 'isFeatured', label: 'Featured', options: BOOLEAN_OPTIONS('Featured', 'Not featured') },
  ],
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'role', label: 'Role', type: 'text', placeholder: 'CEO' },
    { name: 'company', label: 'Company', type: 'text' },
    { name: 'avatar', label: 'Photo', type: 'image' },
    { name: 'message', label: 'Message', type: 'textarea', required: true, wide: true },
    { name: 'rating', label: 'Rating', type: 'number', min: 1, max: 5, defaultValue: '5' },
    orderField,
    featuredField,
    activeField,
  ],
};
