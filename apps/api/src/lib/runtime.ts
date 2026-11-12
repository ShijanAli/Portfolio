import { waitUntil } from '@vercel/functions';

/**
 * True when running as a Vercel serverless function. There the process is frozen as soon
 * as a response is sent, there is no always-on process for timers, and the file system is
 * read-only. Everything that assumes otherwise branches on this.
 */
export const isServerless = Boolean(process.env.VERCEL);

/**
 * Lets work finish after the response has been sent: emails, audit entries, cache
 * refreshes. A plain `void promise` is enough on a normal server; on Vercel the function
 * would be frozen mid-way, so the platform has to be told to wait for it.
 *
 * Failures must be handled by the caller; this only keeps the process alive.
 */
export function runInBackground(work: Promise<unknown>): void {
  if (isServerless) waitUntil(work);
  else void work;
}
