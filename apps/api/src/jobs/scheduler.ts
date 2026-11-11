import { logger } from '@/lib/logger';

interface Job {
  name: string;
  everyMinutes: number;
  run: () => Promise<void>;
}

const timers: NodeJS.Timeout[] = [];

/**
 * A small in-process scheduler. Each job is safe to run late or twice, because the work
 * it does is recorded in the database, so it needs no external queue.
 */
export function startJobs(jobs: Job[]): void {
  for (const job of jobs) {
    let running = false;

    const tick = async () => {
      if (running) return; // The previous run is still going.
      running = true;
      try {
        await job.run();
      } catch (error) {
        logger.error({ err: error, job: job.name }, 'Background job failed');
      } finally {
        running = false;
      }
    };

    timers.push(setInterval(() => void tick(), job.everyMinutes * 60_000));
    void tick();
  }
}

export function stopJobs(): void {
  timers.splice(0).forEach(clearInterval);
}
