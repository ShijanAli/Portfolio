import { deleteExpiredRateLimits } from '@/common/utils/pg-rate-limit-store';
import { pruneAnalytics } from './analytics-retention.job';

/** Housekeeping: old analytics rows and expired rate limit counters. */
export async function runMaintenance(): Promise<void> {
  await pruneAnalytics();
  await deleteExpiredRateLimits();
}
