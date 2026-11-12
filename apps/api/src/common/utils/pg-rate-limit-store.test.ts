import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { unique } from '@/tests/helpers';
import { deleteExpiredRateLimits, PgRateLimitStore } from './pg-rate-limit-store';

const prefix = unique('rl');
const store = new PgRateLimitStore(prefix);
store.init({ windowMs: 60_000 } as Parameters<PgRateLimitStore['init']>[0]);

beforeEach(async () => {
  await prisma.rateLimit.deleteMany({ where: { key: { startsWith: prefix } } });
});

afterAll(async () => {
  await prisma.rateLimit.deleteMany({ where: { key: { startsWith: prefix } } });
  await prisma.$disconnect();
});

describe('shared rate limit store', () => {
  it('counts hits per key within a window and keeps keys apart', async () => {
    expect((await store.increment('a')).totalHits).toBe(1);
    expect((await store.increment('a')).totalHits).toBe(2);
    expect((await store.increment('b')).totalHits).toBe(1);
  });

  it('never loses a hit when many requests arrive at once', async () => {
    const results = await Promise.all(Array.from({ length: 25 }, () => store.increment('burst')));
    expect(results.map((result) => result.totalHits).sort((x, y) => x - y)).toEqual(
      Array.from({ length: 25 }, (_, index) => index + 1),
    );
  });

  it('starts a new window once the old one has expired', async () => {
    await store.increment('window');
    await store.increment('window');
    await prisma.rateLimit.update({
      where: { key: `${prefix}:window` },
      data: { resetAt: new Date(Date.now() - 1000) },
    });
    expect((await store.increment('window')).totalHits).toBe(1);
  });

  it('gives a hit back (successful logins are not counted) and can reset a key', async () => {
    await store.increment('login');
    await store.increment('login');
    await store.decrement('login');
    expect((await store.increment('login')).totalHits).toBe(2);

    await store.resetKey('login');
    expect((await store.increment('login')).totalHits).toBe(1);
  });

  it('never goes below zero', async () => {
    await store.increment('floor');
    await store.decrement('floor');
    await store.decrement('floor');
    expect((await store.increment('floor')).totalHits).toBe(1);
  });

  it('cleans up counters that expired long ago, and only those', async () => {
    await store.increment('old');
    await store.increment('fresh');
    await prisma.rateLimit.update({
      where: { key: `${prefix}:old` },
      data: { resetAt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
    });

    await deleteExpiredRateLimits();
    const left = await prisma.rateLimit.findMany({ where: { key: { startsWith: prefix } } });
    expect(left.map((row) => row.key)).toEqual([`${prefix}:fresh`]);
  });
});
