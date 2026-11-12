import { rateLimit } from 'express-rate-limit';
import { isTest } from '@/config/env';
import { isServerless } from '@/lib/runtime';
import { PgRateLimitStore } from '@/common/utils/pg-rate-limit-store';

interface LimiterOptions {
  /** Only count requests that failed, e.g. wrong passwords but not successful logins. */
  failuresOnly?: boolean;
  /**
   * Keep the counters in the database, so they hold across server instances. Used for
   * limits that protect something (logins, public forms). It costs a query per request,
   * so busy, low-stakes limits keep cheap in-memory counters.
   */
  sharedAs?: string;
}

const createLimiter = (
  windowMinutes: number,
  limit: number,
  message: string,
  { failuresOnly = false, sharedAs }: LimiterOptions = {},
) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: failuresOnly,
    // On serverless platforms memory is per instance, so protective limits use the database.
    ...(sharedAs && isServerless ? { store: new PgRateLimitStore(sharedAs) } : {}),
    // If the database is briefly unavailable, let the request through rather than block everyone.
    passOnStoreError: true,
    skip: () => isTest,
    message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message } },
  });

export const globalLimiter = createLimiter(1, 300, 'Too many requests, please slow down.');

/** Password guessing protection: ten wrong attempts per 15 minutes. */
export const authLimiter = createLimiter(
  15,
  10,
  'Too many attempts. Please try again in 15 minutes.',
  { failuresOnly: true, sharedAs: 'login' },
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
  { sharedAs: 'public-form' },
);

/** View counters: generous, but stops a single client from inflating numbers. */
export const viewLimiter = createLimiter(10, 60, 'Too many requests.');

/** Analytics beacons: several per page (view, leave, events). */
export const collectLimiter = createLimiter(1, 120, 'Too many requests.');
