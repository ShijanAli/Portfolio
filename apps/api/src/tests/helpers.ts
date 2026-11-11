import request from 'supertest';
import { createApp } from '@/app';
import { API_PREFIX } from '@/config/constants';
import { signAccessToken } from '@/common/utils/jwt';
import { hashPassword } from '@/common/utils/password';
import { prisma } from '@/lib/prisma';

/** Shared setup for integration tests. They run against the database in DATABASE_URL. */

export const app = createApp();
export const url = (path: string) => `${API_PREFIX}${path}`;

/** Unique per run, so tests never collide with existing rows or each other. */
export const unique = (label: string) =>
  `${label}-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

export async function createTestAdmin() {
  const user = await prisma.user.create({
    data: {
      name: 'Test Admin',
      email: `${unique('admin')}@example.com`,
      passwordHash: await hashPassword('Not-Used-In-Tests-1'),
      role: 'ADMIN',
    },
  });
  const token = signAccessToken({ id: user.id, email: user.email, role: user.role });
  return { user, auth: { Authorization: `Bearer ${token}` } };
}

export const api = () => request(app);
