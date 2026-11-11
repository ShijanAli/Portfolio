import { formatNumber } from '@/lib/format';

interface BarListProps {
  rows: { label: string; value: number }[];
  /** Column heading of the numbers, e.g. "Views". */
  valueLabel: string;
  empty?: string;
}

/**
 * A ranked list with one thin bar per row. Every row prints its own label and value, so
 * nothing depends on hovering or on color.
 */
export function BarList({ rows, valueLabel, empty = 'No data for this period.' }: BarListProps) {
  if (rows.length === 0) return <p className="px-4 py-8 text-center text-muted">{empty}</p>;

  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <table className="w-full">
      <thead className="sr-only">
        <tr>
          <th>Name</th>
          <th>{valueLabel}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <td className="w-full max-w-0 py-1.5 pl-4">
              <p className="truncate" title={row.label}>
                {row.label}
              </p>
              <div className="mt-1 h-1.5 rounded-full bg-grid">
                <div
                  className="h-full rounded-full bg-series-1"
                  style={{ width: `${Math.max(2, (row.value / max) * 100)}%` }}
                />
              </div>
            </td>
            <td className="py-1.5 pr-4 pl-4 text-right align-top font-medium tabular-nums">
              {formatNumber(row.value)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
