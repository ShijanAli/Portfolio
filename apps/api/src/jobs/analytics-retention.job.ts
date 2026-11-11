import { logger } from '@/lib/logger';
import { analyticsService } from '@/modules/analytics/analytics.service';

/** Roughly 13 months: enough for year-over-year comparison, no longer. */
const RETENTION_DAYS = 400;

export async function pruneAnalytics(): Promise<void> {
  const removed = await analyticsService.deleteOlderThan(RETENTION_DAYS);
  if (removed > 0) logger.info({ removed }, 'Pruned old analytics visitors');
}
