import { existsSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { LOCAL_UPLOAD_DIR } from '@/lib/storage';
import { api, createTestAdmin, url } from '@/tests/helpers';

let auth: { Authorization: string };
let adminId: string;

// A real 1x1 PNG.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

const upload = (file: Buffer, filename: string) =>
  api()
    .post(url('/media'))
    .set(auth)
    .field('folder', 'blog')
    .field('alt', 'A dot')
    .attach('file', file, filename);

beforeAll(async () => {
  const admin = await createTestAdmin();
  auth = admin.auth;
  adminId = admin.user.id;
});

afterAll(async () => {
  await prisma.user.delete({ where: { id: adminId } });
  await prisma.$disconnect();
});

describe('media', () => {
  it('requires authentication', async () => {
    const res = await api().post(url('/media')).attach('file', PNG, 'dot.png');
    expect(res.status).toBe(401);
  });

  it('rejects files whose content is not an allowed type, whatever the name says', async () => {
    const res = await upload(Buffer.from('<script>alert(1)</script>'), 'innocent.png');

    expect(res.status).toBe(422);
    expect(res.body.error.fields).toHaveProperty('file');
  });

  it('stores an image, serves it, and removes the file when deleted', async () => {
    const res = await upload(PNG, 'dot.png');

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ mimeType: 'image/png', folder: 'blog', alt: 'A dot' });

    const { id, publicId, url: fileUrl } = res.body.data;
    const onDisk = path.join(LOCAL_UPLOAD_DIR, publicId);
    expect(existsSync(onDisk)).toBe(true);
    await api().get(new URL(fileUrl).pathname).expect(200).expect('content-type', 'image/png');

    await api()
      .delete(url(`/media/${id}`))
      .set(auth)
      .expect(200);
    expect(existsSync(onDisk)).toBe(false);
  });
});
