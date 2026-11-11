import type { ReactNode } from 'react';
import type { Option } from '@/components/ui/inputs';

export type FieldType =
  | 'text'
  | 'email'
  | 'url'
  | 'textarea'
  | 'number'
  | 'date'
  | 'datetime'
  | 'time'
  | 'color'
  | 'select'
  | 'switch'
  | 'tags'
  | 'richtext'
  | 'image'
  | 'images'
  | 'relation'
  | 'relations'
  | 'repeater'
  | 'multiselect'
  | 'custom';

/** Describes one form field. A resource's whole form is an array of these. */
export interface FieldConfig {
  /**
   * Key in the request body. A dot makes it nested: `seo.metaTitle` is sent as
   * `{ seo: { metaTitle } }`.
   */
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  /** Fields with the same section are grouped under one heading. */
  section?: string;
  /** For `select` and `multiselect`. */
  options?: Option[];
  /** For `select`: send the chosen value as a number instead of text. */
  numeric?: boolean;
  /** For `number`. */
  min?: number;
  max?: number;
  /** For `relation` / `relations`: the API resource the choices are loaded from. */
  resource?: string;
  /** For `repeater`: the text fields of each item. */
  itemFields?: { name: string; label: string; multiline?: boolean }[];
  /** For `custom`: a one-off control that does not deserve its own field type. */
  render?: (props: { value: unknown; onChange: (value: unknown) => void }) => ReactNode;
  /** Value used when creating. Defaults to an empty value for the field type. */
  defaultValue?: unknown;
  /**
   * Reads the field's value from a record when it is not stored under `name`, e.g.
   * `technologyIds` from the record's `technologies`.
   */
  from?: (record: never) => unknown;
  /** Take the full width of the two-column form grid. */
  wide?: boolean;
  /**
   * Leave the field out of the request when it is empty, instead of sending "clear this".
   * For values the server generates, such as slugs.
   */
  omitEmpty?: boolean;
}

/** Form state. Nested for dotted field names. */
export type FormValues = Record<string, unknown>;
