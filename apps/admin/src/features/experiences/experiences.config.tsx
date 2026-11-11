import { activeCell, dateCell, titleCell } from '@/components/data-table/cells';
import { Badge } from '@/components/ui/Badge';
import { activeField, orderField, periodFields } from '@/components/form/common-fields';
import { BOOLEAN_OPTIONS, type ResourceConfig } from '@/components/resource/types';
import type { Experience } from '@/types';

export const experiencesConfig: ResourceConfig<Experience> = {
  path: 'experiences',
  title: 'Experience',
  singular: 'position',
  description: 'Your work history, newest first.',
  columns: [
    {
      key: 'company',
      header: 'Position',
      sortable: true,
      cell: (row) => titleCell(row.position, row.company),
    },
    { key: 'location', header: 'Location', cell: (row) => row.location ?? '—' },
    { key: 'startDate', header: 'From', sortable: true, cell: (row) => dateCell(row.startDate) },
    {
      key: 'endDate',
      header: 'To',
      cell: (row) => (row.isCurrent ? <Badge tone="accent">Present</Badge> : dateCell(row.endDate)),
    },
    { key: 'isActive', header: 'Status', cell: (row) => activeCell(row.isActive) },
  ],
  filters: [{ name: 'isActive', label: 'Status', options: BOOLEAN_OPTIONS('Active', 'Hidden') }],
  fields: [
    {
      name: 'position',
      label: 'Position',
      type: 'text',
      required: true,
      placeholder: 'Software Engineer',
    },
    { name: 'company', label: 'Company', type: 'text', required: true },
    { name: 'location', label: 'Location', type: 'text', placeholder: 'Dhaka, Bangladesh' },
    { name: 'employmentType', label: 'Employment type', type: 'text', placeholder: 'Full-time' },
    { name: 'companyUrl', label: 'Company website', type: 'url', placeholder: 'https://' },
    { name: 'companyLogo', label: 'Company logo', type: 'image' },
    ...periodFields('I currently work here'),
    orderField,
    { name: 'description', label: 'Description', type: 'textarea', wide: true },
    {
      name: 'highlights',
      label: 'Highlights',
      type: 'tags',
      wide: true,
      placeholder: 'An achievement, then Enter',
    },
    {
      name: 'techStack',
      label: 'Tech stack',
      type: 'tags',
      wide: true,
      placeholder: 'React, then Enter',
    },
    activeField,
  ],
};
