import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { api, createTestAdmin, unique, url } from '@/tests/helpers';

let auth: { Authorization: string };
let adminId: string;
const email = `${unique('visitor')}@example.com`;
const message = { name: 'Jane Client', email, message: 'I would like to discuss a project.' };

beforeAll(async () => {
  const admin = await createTestAdmin();
  auth = admin.auth;
  adminId = admin.user.id;
});

afterAll(async () => {
  await prisma.contactMessage.deleteMany({ where: { email } });
  await prisma.user.delete({ where: { id: adminId } });
  await prisma.$disconnect();
});

describe('contact', () => {
  it('accepts a message from a visitor', async () => {
    const res = await api().post(url('/contact')).send(message);

    expect(res.status).toBe(201);
    expect(await prisma.contactMessage.count({ where: { email } })).toBe(1);
  });

  it('silently drops submissions that fill the honeypot', async () => {
    const res = await api()
      .post(url('/contact'))
      .send({ ...message, website: 'http://spam.example' });

    expect(res.status).toBe(201);
    expect(await prisma.contactMessage.count({ where: { email } })).toBe(1);
  });

  it('validates the form', async () => {
    const res = await api().post(url('/contact')).send({ name: 'J', email: 'nope', message: 'hi' });

    expect(res.status).toBe(422);
    expect(Object.keys(res.body.error.fields).sort()).toEqual(['email', 'message', 'name']);
  });

  it('keeps the inbox private', async () => {
    expect((await api().get(url('/contact'))).status).toBe(401);
    expect((await api().get(url('/contact/unread-count'))).status).toBe(401);
  });

  it('lets an admin read and mark a message as read and replied', async () => {
    const list = await api().get(url('/contact')).set(auth).query({ search: email });
    const [first] = list.body.data;
    expect(first).toMatchObject({ email, isRead: false, repliedAt: null });

    const updated = await api()
      .patch(url(`/contact/${first.id}`))
      .set(auth)
      .send({ isRead: true, replied: true });

    expect(updated.body.data.isRead).toBe(true);
    expect(updated.body.data.repliedAt).not.toBeNull();
  });
});
