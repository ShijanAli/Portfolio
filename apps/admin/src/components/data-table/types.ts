import type { Entity } from '@portfolio/api-client';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface Column<T> {
  /** Field name. Also the value sent as `?sort=` when the column is sortable. */
  key: string;
  header: string;
  sortable?: boolean;
  /** Custom rendering. Defaults to the field's value as text. */
  cell?: (row: T) => ReactNode;
  className?: string;
}

export interface RowAction<T> {
  label: string;
  icon: LucideIcon;
  onSelect: (row: T) => void;
  danger?: boolean;
  /** Hide the action for rows it does not apply to. */
  hidden?: (row: T) => boolean;
}

export interface SortState {
  sort?: string;
  order?: 'asc' | 'desc';
}

export type Row = Entity;
