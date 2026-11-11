import { env, isTest } from '@/config/env';
import { logger } from './logger';

/**
 * Tells the website that data with these cache tags changed, so it re-renders the pages
 * that use it. Best effort: if the website cannot be reached, its cache simply expires on
 * its own a few minutes later.
 */
export function revalidateWebsite(tags: string[]): void {
  if (!env.WEB_REVALIDATE_SECRET || isTest) return;

  void fetch(`${env.WEB_INTERNAL_URL ?? env.WEB_URL}/api/revalidate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-revalidate-secret': env.WEB_REVALIDATE_SECRET,
    },
    body: JSON.stringify({ tags }),
    signal: AbortSignal.timeout(5000),
  }).catch((error: unknown) => {
    logger.debug({ err: error, tags }, 'Website revalidation failed');
  });
}

/** Every cache tag the website uses: one per kind of content it reads from the API. */
const ALL_TAGS = [
  'settings',
  'seo',
  'projects',
  'project-categories',
  'services',
  'experiences',
  'technologies',
  'testimonials',
  'blogs',
  'blog-categories',
];

/**
 * Called when the API starts. A website built or started while the API was unreachable
 * holds pages without content; this makes it fetch everything again.
 */
export const revalidateEverything = () => revalidateWebsite(ALL_TAGS);
