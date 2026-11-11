const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
const numberFormat = new Intl.NumberFormat('en');

const EMPTY = '—';

export const formatDate = (value: string | null | undefined) =>
  value ? dateFormat.format(new Date(value)) : EMPTY;

export const formatDateTime = (value: string | null | undefined) =>
  value ? dateTimeFormat.format(new Date(value)) : EMPTY;

export const formatNumber = (value: number | null | undefined) =>
  value === null || value === undefined ? EMPTY : numberFormat.format(value);

/** "FRONTEND" -> "Frontend", "NO_SHOW" -> "No show" */
export const humanize = (value: string) => {
  const text = value.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};
