import { analyticsService } from '@/modules/analytics/analytics.service';
import { prisma } from '@/lib/prisma';

const RECENT_ITEMS = 5;

class DashboardService {
  /** Everything the admin home screen shows, in one request. */
  async getOverview() {
    const now = new Date();

    const [
      projects,
      services,
      posts,
      draftPosts,
      unreadMessages,
      pendingBookings,
      subscribers,
      upcomingBookings,
      recentMessages,
      popularPosts,
      analytics,
      realtime,
    ] = await Promise.all([
      prisma.project.count({ where: { status: 'PUBLISHED' } }),
      prisma.service.count({ where: { status: 'PUBLISHED' } }),
      prisma.post.count({ where: { status: 'PUBLISHED' } }),
      prisma.post.count({ where: { status: 'DRAFT' } }),
      prisma.contactMessage.count({ where: { isRead: false } }),
      prisma.booking.count({ where: { status: 'PENDING', startAt: { gt: now } } }),
      prisma.subscriber.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.findMany({
        where: { status: { in: ['PENDING', 'CONFIRMED'] }, startAt: { gt: now } },
        orderBy: { startAt: 'asc' },
        take: RECENT_ITEMS,
        select: { id: true, code: true, name: true, email: true, startAt: true, status: true },
      }),
      prisma.contactMessage.findMany({
        orderBy: { createdAt: 'desc' },
        take: RECENT_ITEMS,
        select: { id: true, name: true, subject: true, isRead: true, createdAt: true },
      }),
      prisma.post.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { views: 'desc' },
        take: RECENT_ITEMS,
        select: { id: true, title: true, slug: true, views: true },
      }),
      analyticsService.getOverview({ timezone: 'UTC' }),
      analyticsService.getRealtime(),
    ]);

    return {
      counts: {
        projects,
        services,
        posts,
        draftPosts,
        unreadMessages,
        pendingBookings,
        subscribers,
      },
      upcomingBookings,
      recentMessages,
      popularPosts,
      /** Last 30 days compared with the 30 days before. */
      analytics: { ...analytics, activeVisitors: realtime.activeVisitors },
    };
  }
}

export const dashboardService = new DashboardService();
