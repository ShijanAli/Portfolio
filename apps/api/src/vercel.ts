import { createApp } from './app';

/**
 * Entry point when the API runs as a Vercel serverless function (see api/index.js).
 * The function handler is the Express app itself; there is no `listen()` and no timers:
 * scheduled work arrives through the cron endpoints instead.
 */
export default createApp();
