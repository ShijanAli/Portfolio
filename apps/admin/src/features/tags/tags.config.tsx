import { dateCell, titleCell } from '@/components/data-table/cells';
import { slugField } from '@/components/form/common-fields';
import type { ResourceConfig } from '@/components/resource/types';
import type { Tag } from '@/types';

export const tagsConfig: ResourceConfig<Tag> = {
  path: 'tags',
  title: 'Tags',
  singular: 'tag',
  description: 'Labels for blog posts.',
  columns: [
    { key: 'name', header: 'Name', sortable: true, cell: (row) => titleCell(row.name, row.slug) },
    { key: 'posts', header: 'Posts', cell: (row) => row._count.posts },
    { key: 'createdAt', header: 'Created', sortable: true, cell: (row) => dateCell(row.createdAt) },
  ],
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'react' },
    slugField,
  ],
};
