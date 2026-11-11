import { titleCell } from '@/components/data-table/cells';
import { orderField, slugField } from '@/components/form/common-fields';
import type { ResourceConfig } from '@/components/resource/types';
import type { ProjectCategory } from '@/types';

export const projectCategoriesConfig: ResourceConfig<ProjectCategory> = {
  path: 'project-categories',
  title: 'Project categories',
  singular: 'category',
  columns: [
    { key: 'name', header: 'Name', sortable: true, cell: (row) => titleCell(row.name, row.slug) },
    { key: 'projects', header: 'Projects', cell: (row) => row._count.projects },
    { key: 'order', header: 'Order', sortable: true },
  ],
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Web apps' },
    slugField,
    orderField,
  ],
};
