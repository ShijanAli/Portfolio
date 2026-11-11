import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { api, createTestAdmin, url } from '@/tests/helpers';

let auth: { Authorization: string };
let adminId: string;
let previousTheme: Awaited<ReturnType<typeof prisma.siteSetting.findUnique>>;

beforeAll(async () => {
  const admin = await createTestAdmin();
  auth = admin.auth;
  adminId = admin.user.id;
  previousTheme = await prisma.siteSetting.findUnique({ where: { key: 'theme' } });
});

afterAll(async () => {
  // Put the theme back exactly as it was before the test run.
  await prisma.siteSetting.deleteMany({ where: { key: 'theme' } });
  if (previousTheme) {
    await prisma.siteSetting.create({
      data: { key: 'theme', value: previousTheme.value ?? {} },
    });
  }
  await prisma.user.delete({ where: { id: adminId } });
  await prisma.$disconnect();
});

describe('settings', () => {
  it('serves complete defaults for every key without any stored data', async () => {
    const res = await api().get(url('/settings'));

    expect(res.status).toBe(200);
    expect(Object.keys(res.body.data).sort()).toEqual(
      ['general', 'hero', 'integrations', 'sections', 'seo', 'socials', 'theme'].sort(),
    );
    expect(res.body.data.sections.items).toContainEqual({ key: 'newsletter', enabled: true });
  });

  it('rejects unknown keys and anonymous writes', async () => {
    expect((await api().get(url('/settings/secrets'))).status).toBe(422);
    expect((await api().put(url('/settings/theme')).send({})).status).toBe(401);
  });

  it('validates a setting against the schema for its key', async () => {
    const res = await api().put(url('/settings/theme')).set(auth).send({ accentColor: 'purple' });

    expect(res.status).toBe(422);
    expect(res.body.error.fields).toHaveProperty('accentColor');
  });

  it('saves a setting and fills the fields that were not sent', async () => {
    const saved = await api()
      .put(url('/settings/theme'))
      .set(auth)
      .send({ accentColor: '#00e5a0' });
    expect(saved.body.data).toEqual({ accentColor: '#00e5a0', defaultMode: 'dark' });

    const read = await api().get(url('/settings/theme'));
    expect(read.body.data.accentColor).toBe('#00e5a0');
  });
});
