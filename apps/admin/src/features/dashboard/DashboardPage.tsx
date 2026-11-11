import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Eye, FileText, FolderKanban, Mail, Radio, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { statusCell } from '@/components/data-table/cells';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { ErrorState, Skeleton } from '@/components/ui/feedback';
import { percentChange, StatCard } from '@/components/ui/StatCard';
import { api } from '@/lib/api';
import { formatDateTime, formatNumber } from '@/lib/format';

interface Totals {
  views: number;
  visitors: number;
}

interface DashboardData {
  counts: {
    projects: number;
    services: number;
    posts: number;
    draftPosts: number;
    unreadMessages: number;
    pendingBookings: number;
    subscribers: number;
  };
  upcomingBookings: { id: string; code: string; name: string; startAt: string; status: string }[];
  recentMessages: {
    id: string;
    name: string;
    subject: string | null;
    isRead: boolean;
    createdAt: string;
  }[];
  popularPosts: { id: string; title: string; views: number }[];
  analytics: { totals: Totals; previousTotals: Totals; activeVisitors: number };
}

function Panel({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: ReactNode[];
}) {
  return (
    <Card>
      <h2 className="border-b border-border px-4 py-3 font-medium">{title}</h2>
      {children.length > 0 ? (
        <ul className="divide-y divide-border">{children}</ul>
      ) : (
        <p className="px-4 py-8 text-center text-muted">{empty}</p>
      )}
    </Card>
  );
}

const row = 'flex items-center justify-between gap-3 px-4 py-3';

export function DashboardPage() {
  const { data, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardData>('/dashboard'),
  });

  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;

  if (!data) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      </>
    );
  }

  const { counts, analytics } = data;

  return (
    <>
      <PageHeader title="Dashboard" description="How your site is doing over the last 30 days." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Page views"
          value={formatNumber(analytics.totals.views)}
          icon={Eye}
          delta={percentChange(analytics.totals.views, analytics.previousTotals.views)}
        />
        <StatCard
          label="Visitors"
          value={formatNumber(analytics.totals.visitors)}
          icon={Users}
          delta={percentChange(analytics.totals.visitors, analytics.previousTotals.visitors)}
        />
        <StatCard
          label="On the site now"
          value={formatNumber(analytics.activeVisitors)}
          icon={Radio}
        />
        <StatCard label="Subscribers" value={formatNumber(counts.subscribers)} icon={Users} />
        <StatCard label="Unread messages" value={formatNumber(counts.unreadMessages)} icon={Mail} />
        <StatCard
          label="Pending bookings"
          value={formatNumber(counts.pendingBookings)}
          icon={CalendarClock}
        />
        <StatCard
          label="Published projects"
          value={formatNumber(counts.projects)}
          icon={FolderKanban}
        />
        <StatCard
          label="Published posts"
          value={formatNumber(counts.posts)}
          icon={FileText}
          hint={`${counts.draftPosts} draft${counts.draftPosts === 1 ? '' : 's'}`}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Upcoming bookings" empty="No upcoming bookings.">
          {data.upcomingBookings.map((booking) => (
            <li key={booking.id} className={row}>
              <div>
                <p className="font-medium">{booking.name}</p>
                <p className="text-xs text-muted">{formatDateTime(booking.startAt)}</p>
              </div>
              {statusCell(booking.status, { CONFIRMED: 'success', PENDING: 'warning' })}
            </li>
          ))}
        </Panel>

        <Panel title="Recent messages" empty="No messages yet.">
          {data.recentMessages.map((message) => (
            <li key={message.id}>
              <Link to="/messages" className={`${row} hover:bg-raised/40`}>
                <div className="min-w-0">
                  <p className={message.isRead ? 'text-muted' : 'font-medium'}>{message.name}</p>
                  <p className="truncate text-xs text-muted">{message.subject ?? 'No subject'}</p>
                </div>
                <span className="shrink-0 text-xs text-muted">
                  {formatDateTime(message.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </Panel>

        <Panel title="Most read posts" empty="No published posts yet.">
          {data.popularPosts.map((post) => (
            <li key={post.id} className={row}>
              <p className="truncate font-medium">{post.title}</p>
              <span className="shrink-0 text-xs text-muted">{formatNumber(post.views)} views</span>
            </li>
          ))}
        </Panel>
      </div>
    </>
  );
}
