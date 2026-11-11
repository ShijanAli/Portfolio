import { Badge, type Tone } from '@/components/ui/Badge';
import { formatDate, humanize } from '@/lib/format';

/** Small reusable cell renderers, so every table shows the same kind of value the same way. */

export const dateCell = (value: string | null | undefined) => (
  <span className="whitespace-nowrap text-muted">{formatDate(value)}</span>
);

export const booleanCell = (value: boolean, labels: [yes: string, no: string] = ['Yes', 'No']) => (
  <Badge tone={value ? 'success' : 'neutral'}>{value ? labels[0] : labels[1]}</Badge>
);

export const activeCell = (isActive: boolean) => booleanCell(isActive, ['Active', 'Hidden']);

export const statusCell = (status: string, tones: Record<string, Tone> = {}) => (
  <Badge tone={tones[status] ?? 'neutral'}>{humanize(status)}</Badge>
);

/** Primary text with a quieter second line. */
export const titleCell = (title: string, subtitle?: string | null) => (
  <div className="min-w-40">
    <p className="font-medium">{title}</p>
    {subtitle && <p className="max-w-xs truncate text-xs text-muted">{subtitle}</p>}
  </div>
);

export const truncatedCell = (text: string | null | undefined) => (
  <p className="max-w-sm truncate text-muted" title={text ?? undefined}>
    {text || '—'}
  </p>
);
