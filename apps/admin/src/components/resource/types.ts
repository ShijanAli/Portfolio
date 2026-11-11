import type { Entity } from '@portfolio/api-client';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Column, RowAction } from '@/components/data-table/types';
import type { ConfirmOptions } from '@/components/modal/ConfirmProvider';
import type { FieldConfig } from '@/components/form/types';
import type { Option } from '@/components/ui/inputs';

export interface FilterConfig {
  /** Query parameter name, e.g. `status`. */
  name: string;
  label: string;
  options: Option[];
}

export const BOOLEAN_OPTIONS = (yes: string, no: string): Option[] => [
  { value: 'true', label: yes },
  { value: 'false', label: no },
];

/** What a row action receives besides the row: ways to change it without leaving the table. */
export interface ResourceHelpers<T> {
  update: (id: string, body: Record<string, unknown>) => Promise<T>;
  /** Runs any API call, then refreshes the table and confirms with a toast. */
  run: (action: () => Promise<unknown>, successMessage: string) => Promise<void>;
}

/** A row action that can ask "are you sure?" first. */
export interface ResourceAction<T> extends RowAction<T> {
  confirm?: (row: T) => ConfirmOptions;
}

/** A row action that needs input first: opens a small form in the common modal. */
export interface FormAction<T> {
  label: string;
  icon: LucideIcon;
  danger?: boolean;
  hidden?: (row: T) => boolean;
  fields: FieldConfig[];
  submitLabel?: string;
  successMessage: string;
  submit: (row: T, values: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Everything that differs between two CRUD screens. A screen is this object plus
 * `<ResourcePage config={...} />`; the table, modal, form, queries and toasts are shared.
 */
export interface ResourceConfig<T extends Entity> {
  /** API path, e.g. `testimonials`. Also the query cache key. */
  path: string;
  /** Plural page title. */
  title: string;
  /** Lowercase singular used in buttons and messages, e.g. "testimonial". */
  singular: string;
  description?: string;
  columns: Column<T>[];
  /** Form fields for create and edit. Omit for resources that are not edited here. */
  fields?: FieldConfig[];
  /**
   * Where the form opens. `modal` (default) suits short forms; `page` gives long forms,
   * such as a blog post, a screen of their own at `/<route>/new` and `/<route>/:id/edit`.
   */
  formLayout?: 'modal' | 'page';
  filters?: FilterConfig[];
  /** Hide the search box for resources without searchable text. */
  searchable?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
  /** Rows that may be edited. Defaults to all of them. */
  canEdit?: (row: T) => boolean;
  /** Adds a "View" action that shows this content in a modal. */
  view?: {
    title: (row: T) => string;
    render: (row: T) => ReactNode;
    onOpen?: (row: T, helpers: ResourceHelpers<T>) => void;
  };
  /** Extra row actions, listed before Edit and Delete. */
  actions?: (helpers: ResourceHelpers<T>) => ResourceAction<T>[];
  /** Row actions that collect input in a modal form before running. */
  formActions?: FormAction<T>[];
}
