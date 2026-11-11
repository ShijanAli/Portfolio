import { titleCell, truncatedCell } from '@/components/data-table/cells';
import { orderField, slugField } from '@/components/form/common-fields';
import type { ResourceConfig } from '@/components/resource/types';
import type { BlogCategory } from '@/types';

export const blogCategoriesConfig: ResourceConfig<BlogCategory> = {
  path: 'blog-categories',
  title: 'Blog categories',
  singular: 'category',
  columns: [
    { key: 'name', header: 'Name', sortable: true, cell: (row) => titleCell(row.name, row.slug) },
    { key: 'description', header: 'Description', cell: (row) => truncatedCell(row.description) },
    { key: 'posts', header: 'Posts', cell: (row) => row._count.posts },
    { key: 'order', header: 'Order', sortable: true },
  ],
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Tutorials' },
    slugField,
    { name: 'description', label: 'Description', type: 'textarea', wide: true },
    orderField,
  ],
};
