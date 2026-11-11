import { activeCell, dateCell, titleCell } from '@/components/data-table/cells';
import { Badge } from '@/components/ui/Badge';
import { activeField, orderField, periodFields } from '@/components/form/common-fields';
import { BOOLEAN_OPTIONS, type ResourceConfig } from '@/components/resource/types';
import type { Education } from '@/types';

export const educationsConfig: ResourceConfig<Education> = {
  path: 'educations',
  title: 'Education',
  singular: 'education entry',
  columns: [
    {
      key: 'institute',
      header: 'Degree',
      sortable: true,
      cell: (row) => titleCell(row.degree, row.institute),
    },
    { key: 'fieldOfStudy', header: 'Field', cell: (row) => row.fieldOfStudy ?? '—' },
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
      name: 'degree',
      label: 'Degree',
      type: 'text',
      required: true,
      placeholder: 'BSc in Computer Science',
    },
    { name: 'institute', label: 'Institute', type: 'text', required: true },
    { name: 'fieldOfStudy', label: 'Field of study', type: 'text' },
    { name: 'grade', label: 'Grade', type: 'text', placeholder: 'CGPA 3.80' },
    ...periodFields('I currently study here'),
    orderField,
    { name: 'description', label: 'Description', type: 'textarea', wide: true },
    activeField,
  ],
};
