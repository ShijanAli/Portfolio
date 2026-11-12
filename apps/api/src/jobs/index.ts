import { sendBookingReminders } from './booking-reminder.job';
import { processCampaigns } from './campaign.job';
import { runMaintenance } from './maintenance.job';
import { startJobs } from './scheduler';

export { stopJobs } from './scheduler';

/** Every recurring job. Run by the in-process scheduler, or by cron endpoints on serverless. */
export const JOBS = {
  reminders: sendBookingReminders,
  campaigns: processCampaigns,
  maintenance: runMaintenance,
} as const;

export type JobName = keyof typeof JOBS;

export const JOB_NAMES = Object.keys(JOBS) as JobName[];

/** Starts the timers of a long-running server. Not used on serverless platforms. */
export function startBackgroundJobs(): void {
  startJobs([
    { name: 'booking-reminders', everyMinutes: 10, run: JOBS.reminders },
    { name: 'campaigns', everyMinutes: 1, run: JOBS.campaigns },
    { name: 'maintenance', everyMinutes: 24 * 60, run: JOBS.maintenance },
  ]);
}
