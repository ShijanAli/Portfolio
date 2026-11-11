import { env, isProduction } from '@/config/env';
import { startBackgroundJobs, stopJobs } from '@/jobs';
import { logger } from '@/lib/logger';
import { revalidateEverything } from '@/lib/revalidate';
import { usesCloudinary } from '@/lib/storage';
import { prisma } from '@/lib/prisma';
import { createApp } from './app';

const server = createApp().listen(env.PORT, () => {
  logger.info(`API listening on http://localhost:${env.PORT}`);
  startBackgroundJobs();
  revalidateEverything();
  warnAboutMissingServices();
});

/** In production, running on a development fallback is almost always a mistake. */
function warnAboutMissingServices() {
  if (!isProduction) return;
  if (!env.BREVO_API_KEY) {
    logger.warn('BREVO_API_KEY is not set: emails (bookings, newsletter) are logged, not sent.');
  }
  if (!usesCloudinary) {
    logger.warn(
      'Cloudinary is not configured: uploads are stored on local disk. Mount a volume at ./uploads or they are lost on redeploy.',
    );
  }
  if (!env.WEB_REVALIDATE_SECRET) {
    logger.warn(
      'WEB_REVALIDATE_SECRET is not set: the website shows edits only after its cache expires.',
    );
  }
}

async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  stopJobs();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Do not hang forever on open keep-alive connections.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
