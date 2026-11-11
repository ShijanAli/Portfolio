import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { formatNumber } from '@/lib/format';

export interface Series {
  key: string;
  label: string;
  /** A CSS color, e.g. `var(--color-series-1)`. */
  color: string;
}

interface TimeSeriesChartProps {
  data: ({ date: string } & Record<string, number | string>)[];
  series: Series[];
  /** Accessible summary of what the chart shows. */
  label: string;
  height?: number;
}

const MARGIN = { top: 12, right: 12, bottom: 26, left: 44 };
const TICK_COUNT = 4;
const TOOLTIP_WIDTH = 168;

const dayFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const fullDayFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const toDate = (date: string) => new Date(`${date}T00:00:00`);

/** Rounds the axis maximum up to a clean number: 1, 2, 2.5, 5 or 10 times a power of ten. */
function niceMax(value: number): number {
  if (value <= TICK_COUNT) return TICK_COUNT;
  const step = value / TICK_COUNT;
  const magnitude = 10 ** Math.floor(Math.log10(step));
  const nice = [1, 2, 2.5, 5, 10].find((factor) => factor * magnitude >= step) ?? 10;
  return nice * magnitude * TICK_COUNT;
}

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

/**
 * Line chart of one or more series over days, all on one shared axis. Pointing anywhere
 * (or using the arrow keys) snaps a crosshair to the nearest day and shows every series'
 * value for it.
 */
export function TimeSeriesChart({ data, series, label, height = 280 }: TimeSeriesChartProps) {
  const [ref, width] = useWidth();
  const [active, setActive] = useState<number | null>(null);

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = height - MARGIN.top - MARGIN.bottom;
  const valueOf = (index: number, key: string) => Number(data[index]?.[key] ?? 0);
  const max = niceMax(
    Math.max(0, ...data.flatMap((_, index) => series.map(({ key }) => valueOf(index, key)))),
  );

  const x = (index: number) =>
    MARGIN.left + (data.length > 1 ? (index / (data.length - 1)) * innerWidth : innerWidth / 2);
  const y = (value: number) => MARGIN.top + innerHeight - (value / max) * innerHeight;
  const baseline = y(0);

  const linePath = (key: string) =>
    data
      .map((_, index) => `${index === 0 ? 'M' : 'L'}${x(index)},${y(valueOf(index, key))}`)
      .join(' ');
  const areaPath = (key: string) =>
    `${linePath(key)} L${x(data.length - 1)},${baseline} L${x(0)},${baseline} Z`;

  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, index) => (max / TICK_COUNT) * index);
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(innerWidth / 72))));

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const offset = event.clientX - event.currentTarget.getBoundingClientRect().left - MARGIN.left;
    const index = Math.round((offset / Math.max(1, innerWidth)) * (data.length - 1));
    setActive(Math.min(data.length - 1, Math.max(0, index)));
  };

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    setActive((current) =>
      Math.min(data.length - 1, Math.max(0, (current ?? data.length - 1) + step)),
    );
  };

  const activeRow = active === null ? undefined : data[active];
  const tooltipLeft =
    active === null
      ? 0
      : Math.min(Math.max(x(active) - TOOLTIP_WIDTH / 2, 0), Math.max(0, width - TOOLTIP_WIDTH));

  return (
    <div>
      {series.length > 1 && (
        <ul className="mb-3 flex flex-wrap gap-4 text-xs text-muted">
          {series.map((item) => (
            <li key={item.key} className="flex items-center gap-1.5">
              <span
                className="h-0.5 w-4 rounded-full"
                style={{ background: item.color }}
                aria-hidden
              />
              {item.label}
            </li>
          ))}
        </ul>
      )}

      <div ref={ref} className="relative" style={{ height }}>
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={`${label}. Use the left and right arrow keys to read each day.`}
            tabIndex={0}
            className="block touch-none rounded-lg focus-visible:outline-2"
            onPointerMove={onPointerMove}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive((current) => current ?? data.length - 1)}
            onBlur={() => setActive(null)}
            onKeyDown={onKeyDown}
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={MARGIN.left}
                  x2={width - MARGIN.right}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke="var(--color-grid)"
                />
                <text
                  x={MARGIN.left - 8}
                  y={y(tick)}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-muted text-[11px] tabular-nums"
                >
                  {formatNumber(tick)}
                </text>
              </g>
            ))}

            {data.map((row, index) =>
              index % labelEvery === 0 ? (
                <text
                  key={row.date}
                  x={x(index)}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-muted text-[11px]"
                >
                  {dayFormat.format(toDate(row.date))}
                </text>
              ) : null,
            )}

            {series[0] && <path d={areaPath(series[0].key)} fill={series[0].color} opacity={0.1} />}
            {series.map((item) => (
              <path
                key={item.key}
                d={linePath(item.key)}
                fill="none"
                stroke={item.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}

            {active !== null && (
              <g>
                <line
                  x1={x(active)}
                  x2={x(active)}
                  y1={MARGIN.top}
                  y2={baseline}
                  stroke="var(--color-muted)"
                  strokeWidth={1}
                />
                {series.map((item) => (
                  <circle
                    key={item.key}
                    cx={x(active)}
                    cy={y(valueOf(active, item.key))}
                    r={4}
                    fill={item.color}
                    stroke="var(--color-surface)"
                    strokeWidth={2}
                  />
                ))}
              </g>
            )}
          </svg>
        )}

        {activeRow && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 rounded-lg border border-border bg-raised px-3 py-2 text-xs shadow-xl"
            style={{ left: tooltipLeft, width: TOOLTIP_WIDTH }}
          >
            <p className="mb-1 text-muted">{fullDayFormat.format(toDate(activeRow.date))}</p>
            {series.map((item) => (
              <p key={item.key} className="flex items-center gap-2">
                <span
                  className="h-0.5 w-3 rounded-full"
                  style={{ background: item.color }}
                  aria-hidden
                />
                <span className="flex-1 text-muted">{item.label}</span>
                <span className="font-semibold text-fg tabular-nums">
                  {formatNumber(Number(activeRow[item.key] ?? 0))}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
