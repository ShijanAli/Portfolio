import { booleanCell, dateCell, statusCell, titleCell } from '@/components/data-table/cells';
import { featuredField, seoFields, slugField } from '@/components/form/common-fields';
import { BOOLEAN_OPTIONS, type ResourceConfig } from '@/components/resource/types';
import { formatNumber, humanize } from '@/lib/format';
import type { Post } from '@/types';

const STATUSES = ['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'].map((value) => ({
  value,
  label: humanize(value),
}));

const TONES = {
  PUBLISHED: 'success',
  DRAFT: 'warning',
  SCHEDULED: 'accent',
  ARCHIVED: 'neutral',
} as const;

export const postsConfig: ResourceConfig<Post> = {
  path: 'blogs',
  title: 'Posts',
  singular: 'post',
  description: 'Blog articles.',
  formLayout: 'page',
  columns: [
    {
      key: 'title',
      header: 'Post',
      sortable: true,
      cell: (row) => titleCell(row.title, `${row.readingTime} min read · ${row.author.name}`),
    },
    { key: 'category', header: 'Category', cell: (row) => row.category?.name ?? '—' },
    { key: 'status', header: 'Status', cell: (row) => statusCell(row.status, TONES) },
    {
      key: 'publishedAt',
      header: 'Published',
      sortable: true,
      cell: (row) => dateCell(row.publishedAt),
    },
    { key: 'views', header: 'Views', sortable: true, cell: (row) => formatNumber(row.views) },
    { key: 'isFeatured', header: 'Featured', cell: (row) => booleanCell(row.isFeatured) },
  ],
  filters: [
    { name: 'status', label: 'Status', options: STATUSES },
    { name: 'isFeatured', label: 'Featured', options: BOOLEAN_OPTIONS('Featured', 'Not featured') },
  ],
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { ...slugField, placeholder: 'Generated from the title' },
    {
      name: 'excerpt',
      label: 'Excerpt',
      type: 'textarea',
      wide: true,
      help: 'Short summary shown on post cards. Up to 300 characters.',
    },
    { name: 'content', label: 'Content', type: 'richtext', required: true },

    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: STATUSES,
      defaultValue: 'DRAFT',
      section: 'Publishing',
    },
    {
      name: 'publishedAt',
      label: 'Publish date',
      type: 'datetime',
      section: 'Publishing',
      help: 'Required for scheduled posts. Otherwise set when the post is first published.',
      omitEmpty: true,
    },
    {
      name: 'categoryId',
      label: 'Category',
      type: 'relation',
      resource: 'blog-categories',
      section: 'Publishing',
    },
    { name: 'coverImage', label: 'Cover image', type: 'image', section: 'Publishing' },
    {
      name: 'tagIds',
      label: 'Tags',
      type: 'relations',
      resource: 'tags',
      section: 'Publishing',
      from: (post: Post) => post.tags.map((tag) => tag.id),
    },
    { ...featuredField, section: 'Publishing' },

    ...seoFields,
  ],
};
