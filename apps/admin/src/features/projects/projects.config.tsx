import { booleanCell, statusCell, titleCell } from '@/components/data-table/cells';
import {
  CONTENT_STATUSES,
  featuredField,
  orderField,
  seoFields,
  slugField,
  statusField,
} from '@/components/form/common-fields';
import { BOOLEAN_OPTIONS, type ResourceConfig } from '@/components/resource/types';
import { formatNumber } from '@/lib/format';
import type { Project } from '@/types';

export const STATUS_TONES = {
  PUBLISHED: 'success',
  DRAFT: 'warning',
  ARCHIVED: 'neutral',
} as const;

const LINKS = 'Links and details';

export const projectsConfig: ResourceConfig<Project> = {
  path: 'projects',
  title: 'Projects',
  singular: 'project',
  description: 'Your portfolio work and case studies.',
  formLayout: 'page',
  columns: [
    {
      key: 'title',
      header: 'Project',
      sortable: true,
      cell: (row) => titleCell(row.title, row.summary),
    },
    { key: 'category', header: 'Category', cell: (row) => row.category?.name ?? '—' },
    { key: 'status', header: 'Status', cell: (row) => statusCell(row.status, STATUS_TONES) },
    { key: 'isFeatured', header: 'Featured', cell: (row) => booleanCell(row.isFeatured) },
    { key: 'views', header: 'Views', sortable: true, cell: (row) => formatNumber(row.views) },
    { key: 'order', header: 'Order', sortable: true },
  ],
  filters: [
    { name: 'status', label: 'Status', options: CONTENT_STATUSES },
    { name: 'isFeatured', label: 'Featured', options: BOOLEAN_OPTIONS('Featured', 'Not featured') },
  ],
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { ...slugField, placeholder: 'Generated from the title' },
    {
      name: 'summary',
      label: 'Summary',
      type: 'textarea',
      required: true,
      wide: true,
      help: 'One or two sentences shown on project cards. Up to 300 characters.',
    },
    statusField,
    { name: 'categoryId', label: 'Category', type: 'relation', resource: 'project-categories' },
    {
      name: 'technologyIds',
      label: 'Technologies',
      type: 'relations',
      resource: 'technologies',
      from: (project: Project) => project.technologies.map((technology) => technology.id),
    },
    { name: 'coverImage', label: 'Cover image', type: 'image' },
    featuredField,
    { name: 'gallery', label: 'Gallery', type: 'images' },
    { name: 'content', label: 'Case study', type: 'richtext' },

    { name: 'liveUrl', label: 'Live URL', type: 'url', placeholder: 'https://', section: LINKS },
    {
      name: 'githubUrl',
      label: 'GitHub URL',
      type: 'url',
      placeholder: 'https://github.com/',
      section: LINKS,
    },
    {
      name: 'role',
      label: 'Your role',
      type: 'text',
      placeholder: 'Full stack developer',
      section: LINKS,
    },
    { name: 'client', label: 'Client', type: 'text', section: LINKS },
    { name: 'startDate', label: 'Start date', type: 'date', section: LINKS },
    { name: 'endDate', label: 'End date', type: 'date', section: LINKS },
    { ...orderField, section: LINKS },

    ...seoFields,
  ],
};
