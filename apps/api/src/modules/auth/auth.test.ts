import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '@/app';
import { API_PREFIX } from '@/config/constants';
import { hashPassword } from '@/common/utils/password';
import { prisma } from '@/lib/prisma';

// Integration test: runs against the database in DATABASE_URL.
const app = createApp();
const email = `auth-test-${Date.now()}@example.com`;
const password = 'Correct-Horse-9';

const login = (body: object) => request(app).post(`${API_PREFIX}/auth/login`).send(body);
const refresh = (cookie: string[]) =>
  request(app).post(`${API_PREFIX}/auth/refresh`).set('Cookie', cookie);
const cookiesOf = (res: request.Response) => res.get('Set-Cookie') ?? [];

beforeAll(async () => {
  await prisma.user.create({
    data: { name: 'Auth Test', email, passwordHash: await hashPassword(password), role: 'EDITOR' },
  });
});

afterAll(async () => {
  await prisma.user.delete({ where: { email } });
  await prisma.$disconnect();
});

describe('auth', () => {
  it('rejects a wrong password without revealing which part was wrong', async () => {
    const wrongPassword = await login({ email, password: 'nope' });
    const unknownUser = await login({ email: 'nobody@example.com', password });

    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe(unknownUser.body.error.message);
  });

  it('returns field errors for an invalid body', async () => {
    const res = await login({ email: 'not-an-email' });

    expect(res.status).toBe(422);
    expect(res.body.error.fields).toHaveProperty('email');
    expect(res.body.error.fields).toHaveProperty('password');
  });

  it('logs in, never exposes the password hash, and sets an httpOnly cookie', async () => {
    const res = await login({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(cookiesOf(res).join(';')).toMatch(/refresh_token=.+HttpOnly/);
  });

  it('guards /me behind a valid access token', async () => {
    const { body } = await login({ email, password });
    const me = `${API_PREFIX}/auth/me`;

    expect((await request(app).get(me)).status).toBe(401);
    expect((await request(app).get(me).set('Authorization', 'Bearer garbage')).status).toBe(401);

    const res = await request(app).get(me).set('Authorization', `Bearer ${body.data.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(email);
  });

  it('rotates refresh tokens and ends every session when one is replayed', async () => {
    const first = cookiesOf(await login({ email, password }));

    const rotated = await refresh(first);
    expect(rotated.status).toBe(200);
    const second = cookiesOf(rotated);

    // Replaying the already-used token is treated as theft.
    expect((await refresh(first)).status).toBe(401);
    expect((await refresh(second)).status).toBe(401);
  });

  it('logout revokes the refresh token', async () => {
    const cookie = cookiesOf(await login({ email, password }));

    await request(app).post(`${API_PREFIX}/auth/logout`).set('Cookie', cookie).expect(200);
    expect((await refresh(cookie)).status).toBe(401);
  });

  it('blocks anonymous users from writing', async () => {
    const res = await request(app).post(`${API_PREFIX}/testimonials`).send({});
    expect(res.status).toBe(401);
  });
});
