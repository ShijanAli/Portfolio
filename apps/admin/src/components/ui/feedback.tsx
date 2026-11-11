import { Inbox, Loader2, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/errors';
import { Button } from './Button';

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn('size-5 animate-spin text-muted', className)} aria-label="Loading" />
  );
}

export function FullPageSpinner() {
  return (
    <div className="grid min-h-screen place-items-center">
      <Spinner className="size-7" />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-raised', className)} />;
}

interface StateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: StateProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <Inbox className="size-8 text-muted/60" aria-hidden />
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <TriangleAlert className="size-8 text-danger" aria-hidden />
      <p className="font-medium">Could not load this</p>
      <p className="max-w-sm text-muted">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
