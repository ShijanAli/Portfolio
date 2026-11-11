import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Clock, Eye, MousePointerClick, Radio, Undo2, Users } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { BarList } from '@/components/charts/BarList';
import { TimeSeriesChart, type Series } from '@/components/charts/TimeSeriesChart';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState, Skeleton } from '@/components/ui/feedback';
import { percentChange, StatCard } from '@/components/ui/StatCard';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatDate, formatNumber } from '@/lib/format';

interface Totals {
  views: number;
  visitors: number;
  sessions: number;
  avgDuration: number;
  bounceRate: number;
}

interface Overview {
  totals: Totals;
  previousTotals: Totals;
  timeseries: { date: string; views: number; visitors: number }[];
}

interface BreakdownRow {
  label: string;
  views: number;
  visitors: number;
}

const RANGES = [7, 30, 90];
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Views and visitors are both counts of the same order, so they share one axis. */
const SERIES: Series[] = [
  { key: 'views', label: 'Page views', color: 'var(--color-series-1)' },
  { key: 'visitors', label: 'Visitors', color: 'var(--color-series-2)' },
];

const BREAKDOWNS = [
  { dimension: 'pages', title: 'Top pages' },
  { dimension: 'referrers', title: 'Where visitors come from' },
  { dimension: 'countries', title: 'Countries' },
  { dimension: 'devices', title: 'Devices' },
  { dimension: 'browsers', title: 'Browsers' },
  { dimension: 'events', title: 'Events' },
];

const isoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** The last `days` days, ending today, in the viewer's timezone. */
function rangeOf(days: number) {
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { from: isoDay(from), to: isoDay(new Date()), timezone };
}

const formatDuration = (seconds: number) =>
  seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;

function Breakdown({
  dimension,
  title,
  range,
}: {
  dimension: string;
  title: string;
  range: object;
}) {
  const { data, isPlaceholderData } = useQuery({
    queryKey: ['analytics', 'breakdown', dimension, range],
    queryFn: () =>
      api.get<BreakdownRow[]>('/analytics/breakdown', { ...range, dimension, limit: 8 }),
    placeholderData: keepPreviousData,
  });

  return (
    <Card className={cn('pb-2 transition-opacity', isPlaceholderData && 'opacity-60')}>
      <h2 className="border-b border-border px-4 py-3 font-medium">{title}</h2>
      <div className="pt-2">
        {data ? (
          <BarList
            valueLabel={dimension === 'events' ? 'Times' : 'Views'}
            rows={data.map((row) => ({ label: row.label, value: row.views }))}
          />
        ) : (
          <Skeleton className="mx-4 my-2 h-40" />
        )}
      </div>
    </Card>
  );
}

function TrafficTable({ rows }: { rows: Overview['timeseries'] }) {
  return (
    <div className="max-h-72 overflow-y-auto">
      <table className="w-full text-left">
        <thead className="sticky top-0 bg-surface text-xs text-muted uppercase">
          <tr>
            <th className="px-2 py-2 font-medium">Day</th>
            <th className="px-2 py-2 text-right font-medium">Page views</th>
            <th className="px-2 py-2 text-right font-medium">Visitors</th>
          </tr>
        </thead>
        <tbody>
          {[...rows].reverse().map((row) => (
            <tr key={row.date} className="border-t border-border">
              <td className="px-2 py-1.5">{formatDate(`${row.date}T00:00:00`)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{formatNumber(row.views)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{formatNumber(row.visitors)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AnalyticsPage() {
  const [params, setParams] = useSearchParams();
  const [showTable, setShowTable] = useState(false);
  const days = RANGES.includes(Number(params.get('days'))) ? Number(params.get('days')) : 30;
  const range = rangeOf(days);

  const overview = useQuery({
    queryKey: ['analytics', 'overview', range],
    queryFn: () => api.get<Overview>('/analytics/overview', range),
    placeholderData: keepPreviousData,
  });
  const realtime = useQuery({
    queryKey: ['analytics', 'realtime'],
    queryFn: () => api.get<{ activeVisitors: number }>('/analytics/realtime'),
    refetchInterval: 30_000,
  });

  const { totals, previousTotals, timeseries } = overview.data ?? {};
  const delta = (key: keyof Totals) =>
    totals && previousTotals ? percentChange(totals[key], previousTotals[key]) : undefined;

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Cookie-free visitor statistics from your own site."
      />

      {/* One row of filters above everything they scope. */}
      <div className="mb-4 flex items-center gap-2" role="group" aria-label="Date range">
        {RANGES.map((option) => (
          <Button
            key={option}
            size="sm"
            variant={option === days ? 'primary' : 'secondary'}
            aria-pressed={option === days}
            onClick={() => setParams({ days: String(option) }, { replace: true })}
          >
            Last {option} days
          </Button>
        ))}
      </div>

      {overview.error ? (
        <ErrorState error={overview.error} onRetry={() => void overview.refetch()} />
      ) : !totals || !timeseries ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        // While a new range loads, the previous numbers stay in place, dimmed.
        <div
          className={cn('space-y-4 transition-opacity', overview.isPlaceholderData && 'opacity-60')}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Page views"
              value={formatNumber(totals.views)}
              icon={Eye}
              delta={delta('views')}
            />
            <StatCard
              label="Visitors"
              value={formatNumber(totals.visitors)}
              icon={Users}
              delta={delta('visitors')}
            />
            <StatCard
              label="Sessions"
              value={formatNumber(totals.sessions)}
              icon={MousePointerClick}
              delta={delta('sessions')}
            />
            <StatCard
              label="Avg. time on page"
              value={formatDuration(totals.avgDuration)}
              icon={Clock}
              delta={delta('avgDuration')}
            />
            <StatCard
              label="Bounce rate"
              value={`${totals.bounceRate}%`}
              icon={Undo2}
              delta={delta('bounceRate')}
              lowerIsBetter
            />
            <StatCard
              label="On the site now"
              value={formatNumber(realtime.data?.activeVisitors ?? 0)}
              icon={Radio}
            />
          </div>

          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium">Traffic per day</h2>
              <Button
                variant="ghost"
                size="sm"
                aria-pressed={showTable}
                onClick={() => setShowTable(!showTable)}
              >
                {showTable ? 'Show chart' : 'Show as table'}
              </Button>
            </div>
            {showTable ? (
              <TrafficTable rows={timeseries} />
            ) : (
              <TimeSeriesChart
                data={timeseries}
                series={SERIES}
                label={`Page views and visitors per day, last ${days} days`}
              />
            )}
          </Card>
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {BREAKDOWNS.map((breakdown) => (
          <Breakdown key={breakdown.dimension} {...breakdown} range={range} />
        ))}
      </div>
    </>
  );
}
