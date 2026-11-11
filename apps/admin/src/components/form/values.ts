import type { FieldConfig, FormValues } from './types';

const TEXT_TYPES = new Set(['text', 'textarea', 'email', 'url', 'richtext', 'image']);
const LIST_TYPES = new Set(['tags', 'images', 'relations', 'repeater', 'multiselect']);

const emptyValue = (field: FieldConfig): unknown => {
  if (field.type === 'switch') return false;
  if (LIST_TYPES.has(field.type)) return [];
  return '';
};

export function getPath(source: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (value, key) => (value as Record<string, unknown> | null | undefined)?.[key],
      source,
    );
}

function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  const last = keys.pop()!;
  const parent = keys.reduce<Record<string, unknown>>(
    (node, key) => (node[key] ??= {}) as Record<string, unknown>,
    target,
  );
  parent[last] = value;
}

const pad = (value: number) => String(value).padStart(2, '0');

/** ISO timestamp -> the local "YYYY-MM-DDTHH:mm" that <input type="datetime-local"> wants. */
function toLocalDateTime(iso: string): string {
  const date = new Date(iso);
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function toControlValue(field: FieldConfig, value: unknown): unknown {
  // <input type="date"> wants YYYY-MM-DD; the API sends full ISO timestamps.
  if (field.type === 'date') return String(value).slice(0, 10);
  if (field.type === 'datetime') return toLocalDateTime(String(value));
  // Inputs and <select> options hold text, whatever the stored type is.
  if (field.type === 'number' || field.type === 'select') return String(value);
  return value;
}

/** A record from the API, or nothing when creating, as values the form controls understand. */
export function toFormValues(fields: FieldConfig[], record?: object): FormValues {
  const values: FormValues = {};

  for (const field of fields) {
    const stored = record
      ? field.from
        ? (field.from as (record: object) => unknown)(record)
        : getPath(record, field.name)
      : undefined;

    const value =
      stored === undefined || stored === null
        ? record
          ? emptyValue(field)
          : (field.defaultValue ?? emptyValue(field))
        : toControlValue(field, stored);

    setPath(values, field.name, value);
  }

  return values;
}

/**
 * Form values as a request body. When editing, an emptied field is sent as an explicit
 * "clear" ('' or null). When creating, empty optional fields are simply left out.
 */
export function toPayload(fields: FieldConfig[], values: FormValues, mode: 'create' | 'edit') {
  const payload: Record<string, unknown> = {};

  for (const field of fields) {
    const value = getPath(values, field.name);
    const isEmpty = value === '' || value === null || value === undefined;

    if (isEmpty) {
      if (mode === 'create' || field.omitEmpty) continue;
      // Free text is cleared with '', everything else with null.
      setPath(payload, field.name, TEXT_TYPES.has(field.type) ? '' : null);
      continue;
    }

    if (field.type === 'number' || field.numeric) setPath(payload, field.name, Number(value));
    else if (field.type === 'datetime')
      setPath(payload, field.name, new Date(String(value)).toISOString());
    else setPath(payload, field.name, value);
  }

  return payload;
}

/** Fields in their original order, grouped by section. */
export function groupBySection(
  fields: FieldConfig[],
): { title: string | undefined; fields: FieldConfig[] }[] {
  const groups: { title: string | undefined; fields: FieldConfig[] }[] = [];
  for (const field of fields) {
    const group = groups.find((item) => item.title === field.section);
    if (group) group.fields.push(field);
    else groups.push({ title: field.section, fields: [field] });
  }
  return groups;
}
