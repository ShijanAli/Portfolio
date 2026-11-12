import { timingSafeEqual } from 'node:crypto';
import { Router, type Request, type RequestHandler } from 'express';
import { env } from '@/config/env';
import { ApiError } from '@/common/utils/api-error';
import { ok } from '@/common/utils/api-response';
import { JOB_NAMES, JOBS, type JobName } from '@/jobs';
import { logger } from '@/lib/logger';

/**
 * Scheduled-job endpoints for serverless hosting, where no always-on process exists to run
 * timers. The platform's scheduler calls them with `Authorization: Bearer <CRON_SECRET>`.
 */
const router = Router();

const bearerOf = (req: Request) => req.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';

const requireCronSecret: RequestHandler = (req, _res, next) => {
  if (!env.CRON_SECRET) {
    throw new ApiError(503, 'CRON_DISABLED', 'Scheduled jobs are not configured (CRON_SECRET)');
  }
  const given = Buffer.from(bearerOf(req));
  const expected = Buffer.from(env.CRON_SECRET);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    throw ApiError.unauthorized();
  }
  next();
};

const isJobName = (value: string): value is JobName => (JOB_NAMES as string[]).includes(value);

async function run(names: JobName[]) {
  const results: Record<string, 'ok' | 'failed'> = {};
  // One after another: they share a database connection budget and a time limit.
  for (const name of names) {
    try {
      await JOBS[name]();
      results[name] = 'ok';
    } catch (error) {
      results[name] = 'failed';
      logger.error({ err: error, job: name }, 'Scheduled job failed');
    }
  }
  return results;
}

/** Runs every job. A single daily call to this is enough on a plan without frequent crons. */
router.get('/all', requireCronSecret, async (_req, res) => {
  ok(res, await run(JOB_NAMES));
});

router.get('/:job', requireCronSecret, async (req, res) => {
  const name = String(req.params.job);
  if (!isJobName(name)) throw ApiError.notFound('Job');
  ok(res, await run([name]));
});

export default router;
