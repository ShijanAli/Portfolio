import { Prisma } from '@prisma/client';
import type { ClientRateLimitInfo, Options, Store } from 'express-rate-limit';
import { prisma } from '@/lib/prisma';

/**
 * Rate limit counters kept in PostgreSQL, so every server instance sees the same numbers.
 * The default in-memory store counts per process, which on a serverless platform (a new
 * instance for any request) means it limits nothing.
 *
 * One atomic statement per hit: it starts a new window when the old one has expired and
 * otherwise adds one, so concurrent requests can never read the same count.
 */
export class PgRateLimitStore implements Store {
  /** Counters are shared across processes, not kept locally. */
  localKeys = false;
  private windowMs = 60_000;

  /** `keyPrefix` keeps the counters of different limiters apart. */
  constructor(private readonly keyPrefix: string) {}

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  private keyOf(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const resetAt = new Date(Date.now() + this.windowMs);
    const [row] = await prisma.$queryRaw<{ hits: number; resetAt: Date }[]>(Prisma.sql`
      INSERT INTO "RateLimit" ("key", "hits", "resetAt")
      VALUES (${this.keyOf(key)}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "hits" = CASE WHEN "RateLimit"."resetAt" <= timezone('utc', now()) THEN 1 ELSE "RateLimit"."hits" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= timezone('utc', now()) THEN ${resetAt} ELSE "RateLimit"."resetAt" END
      RETURNING "hits", "resetAt"`);

    return { totalHits: row?.hits ?? 1, resetTime: row?.resetAt ?? resetAt };
  }

  async decrement(key: string): Promise<void> {
    await prisma.$executeRaw(
      Prisma.sql`UPDATE "RateLimit" SET "hits" = GREATEST("hits" - 1, 0) WHERE "key" = ${this.keyOf(key)}`,
    );
  }

  async resetKey(key: string): Promise<void> {
    await prisma.rateLimit.deleteMany({ where: { key: this.keyOf(key) } });
  }
}

/** Removes counters whose window has long passed. Run from the maintenance job. */
export async function deleteExpiredRateLimits(): Promise<number> {
  const { count } = await prisma.rateLimit.deleteMany({
    where: { resetAt: { lt: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  return count;
}
