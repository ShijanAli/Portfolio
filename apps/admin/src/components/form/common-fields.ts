import { humanize } from '@/lib/format';
import type { FieldConfig } from './types';

/** Fields that appear, unchanged, in many resources. Defined once and reused in configs. */

export const slugField: FieldConfig = {
  name: 'slug',
  label: 'Slug',
  type: 'text',
  placeholder: 'Generated from the name',
  help: 'Used in the URL. Leave empty to generate it.',
  omitEmpty: true,
};

export const orderField: FieldConfig = {
  name: 'order',
  label: 'Display order',
  type: 'number',
  min: 0,
  defaultValue: '0',
  help: 'Lower numbers are shown first.',
};

export const activeField: FieldConfig = {
  name: 'isActive',
  label: 'Visible on the website',
  type: 'switch',
  defaultValue: true,
};

export const featuredField: FieldConfig = {
  name: 'isFeatured',
  label: 'Featured',
  type: 'switch',
  help: 'Highlighted on the home page.',
};

/** Start date, end date and an "ongoing" switch, as used by experience and education. */
export const periodFields = (currentLabel: string): FieldConfig[] => [
  { name: 'startDate', label: 'Start date', type: 'date', required: true },
  { name: 'endDate', label: 'End date', type: 'date', help: 'Leave empty if ongoing.' },
  { name: 'isCurrent', label: currentLabel, type: 'switch' },
];

export const CONTENT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'].map((value) => ({
  value,
  label: humanize(value),
}));

/** Draft / published / archived, as used by projects and services. */
export const statusField: FieldConfig = {
  name: 'status',
  label: 'Status',
  type: 'select',
  required: true,
  options: CONTENT_STATUSES,
  defaultValue: 'DRAFT',
  help: 'Only published items are visible on the website.',
};

const SEO = 'Search engines and sharing';

/** The SEO block of every content item. Sent as a nested `seo` object. */
export const seoFields: FieldConfig[] = [
  {
    name: 'seo.metaTitle',
    label: 'Meta title',
    type: 'text',
    section: SEO,
    help: 'Shown in search results. Up to 70 characters. Defaults to the title.',
  },
  {
    name: 'seo.canonicalUrl',
    label: 'Canonical URL',
    type: 'url',
    section: SEO,
    placeholder: 'https://',
  },
  {
    name: 'seo.metaDescription',
    label: 'Meta description',
    type: 'textarea',
    section: SEO,
    wide: true,
    help: 'Up to 170 characters.',
  },
  { name: 'seo.keywords', label: 'Keywords', type: 'tags', section: SEO, wide: true },
  { name: 'seo.ogImage', label: 'Sharing image', type: 'image', section: SEO },
  {
    name: 'seo.noIndex',
    label: 'Hide from search engines',
    type: 'switch',
    section: SEO,
    help: 'Adds a noindex tag to this page.',
  },
];
