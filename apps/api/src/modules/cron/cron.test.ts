import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { api, url } from '@/tests/helpers';

const SECRET = 'test-cron-secret-0123456789';
const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

afterAll(() => prisma.$disconnect());

describe('scheduled job endpoints', () => {
  it('rejects calls without the secret, with a wrong secret and with a prefix of it', async () => {
    expect((await api().get(url('/internal/cron/all'))).status).toBe(401);
    expect((await api().get(url('/internal/cron/all')).set(bearer('wrong'))).status).toBe(401);
    expect(
      (
        await api()
          .get(url('/internal/cron/all'))
          .set(bearer(SECRET.slice(0, -1)))
      ).status,
    ).toBe(401);
  });

  it('is not reachable with a normal admin or visitor session', async () => {
    const res = await api()
      .get(url('/internal/cron/reminders'))
      .set({ Authorization: 'Bearer not-a-jwt' });
    expect(res.status).toBe(401);
  });

  it('runs one named job', async () => {
    const res = await api().get(url('/internal/cron/maintenance')).set(bearer(SECRET));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ maintenance: 'ok' });
  });

  it('runs every job and reports each one', async () => {
    const res = await api().get(url('/internal/cron/all')).set(bearer(SECRET));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ reminders: 'ok', campaigns: 'ok', maintenance: 'ok' });
  });

  it('answers 404 for an unknown job', async () => {
    expect((await api().get(url('/internal/cron/drop-database')).set(bearer(SECRET))).status).toBe(
      404,
    );
  });
});
