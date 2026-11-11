import { pruneAnalytics } from './analytics-retention.job';
import { sendBookingReminders } from './booking-reminder.job';
import { processCampaigns } from './campaign.job';
import { startJobs } from './scheduler';

export { stopJobs } from './scheduler';

export function startBackgroundJobs(): void {
  startJobs([
    { name: 'booking-reminders', everyMinutes: 10, run: sendBookingReminders },
    { name: 'campaigns', everyMinutes: 1, run: processCampaigns },
    { name: 'analytics-retention', everyMinutes: 24 * 60, run: pruneAnalytics },
  ]);
}
