import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  /** Change against the previous period, in percent. Omit when there is no baseline. */
  delta?: number;
  /** For metrics where a rise is bad news, e.g. bounce rate. */
  lowerIsBetter?: boolean;
  hint?: string;
}

/** Percentage change, or undefined when the previous value gives nothing to compare with. */
export function percentChange(current: number, previous: number): number | undefined {
  if (previous === 0) return undefined;
  return Math.round(((current - previous) / previous) * 100);
}

/** A headline number with an optional change against the previous period. */
export function StatCard({ label, value, icon: Icon, delta, lowerIsBetter, hint }: StatCardProps) {
  const isGood = delta !== undefined && (lowerIsBetter ? delta <= 0 : delta >= 0);
  const Arrow = delta !== undefined && delta < 0 ? ArrowDownRight : ArrowUpRight;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-muted">
        <p>{label}</p>
        {Icon && <Icon className="size-4" />}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {delta !== undefined && (
        <p
          className={cn(
            'mt-1 flex flex-wrap items-center gap-x-1 text-xs',
            isGood ? 'text-success' : 'text-danger',
          )}
        >
          <Arrow className="size-3.5" aria-hidden />
          {delta > 0 ? '+' : ''}
          {delta}%<span className="whitespace-nowrap text-muted">vs previous period</span>
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  );
}
