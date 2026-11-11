import { rateLimit } from 'express-rate-limit';
import { isTest } from '@/config/env';

interface LimiterOptions {
  /** Only count requests that failed, e.g. wrong passwords but not successful logins. */
  failuresOnly?: boolean;
}

const createLimiter = (
  windowMinutes: number,
  limit: number,
  message: string,
  { failuresOnly = false }: LimiterOptions = {},
) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: failuresOnly,
    skip: () => isTest,
    message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message } },
  });

export const globalLimiter = createLimiter(1, 300, 'Too many requests, please slow down.');

/** Password guessing protection: ten wrong attempts per 15 minutes. */
export const authLimiter = createLimiter(
  15,
  10,
  'Too many attempts. Please try again in 15 minutes.',
  { failuresOnly: true },
);

/**
 * Session refresh runs on every page load of the admin, so it needs far more room than
 * login. The refresh token itself is a 384-bit secret, so guessing is not the concern here.
 */
export const refreshLimiter = createLimiter(15, 300, 'Too many requests, please slow down.');

/** Public write endpoints: contact, booking, newsletter. */
export const publicFormLimiter = createLimiter(
  60,
  10,
  'Too many submissions. Please try again later.',
);

/** View counters: generous, but stops a single client from inflating numbers. */
export const viewLimiter = createLimiter(10, 60, 'Too many requests.');

/** Analytics beacons: several per page (view, leave, events). */
export const collectLimiter = createLimiter(1, 120, 'Too many requests.');
