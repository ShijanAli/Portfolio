import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { api, createTestAdmin, unique, url } from '@/tests/helpers';

let auth: { Authorization: string };
let adminId: string;
const title = unique('Scroll animations');
const draft = { title, content: '<p>Hello <script>alert(1)</script><strong>world</strong></p>' };

const createPost = (body: object) => api().post(url('/blogs')).set(auth).send(body);

beforeAll(async () => {
  const admin = await createTestAdmin();
  auth = admin.auth;
  adminId = admin.user.id;
});

afterAll(async () => {
  await prisma.post.deleteMany({ where: { authorId: adminId } });
  await prisma.user.delete({ where: { id: adminId } });
  await prisma.$disconnect();
});

describe('blog', () => {
  let id: string;
  let slug: string;

  it('creates a draft with a generated slug, sanitized content and the signed-in author', async () => {
    const res = await createPost({ ...draft, authorId: 'someone-else' });

    expect(res.status).toBe(201);
    ({ id, slug } = res.body.data);
    expect(slug).toMatch(/^scroll-animations-/);
    expect(res.body.data.content).toBe('<p>Hello <strong>world</strong></p>');
    expect(res.body.data.author.id).toBe(adminId);
    expect(res.body.data.status).toBe('DRAFT');
    expect(res.body.data.publishedAt).toBeNull();
  });

  it('suffixes the slug when the title is reused', async () => {
    const res = await createPost(draft);
    expect(res.body.data.slug).toBe(`${slug}-2`);
  });

  it('hides drafts from visitors but shows them to staff', async () => {
    expect((await api().get(url(`/blogs/slug/${slug}`))).status).toBe(404);
    expect(
      (
        await api()
          .get(url(`/blogs/slug/${slug}`))
          .set(auth)
      ).status,
    ).toBe(200);
  });

  it('rejects a scheduled post without a future date', async () => {
    const res = await createPost({ ...draft, status: 'SCHEDULED' });
    expect(res.status).toBe(422);
    expect(res.body.error.fields).toHaveProperty('publishedAt');
  });

  it('keeps a scheduled post hidden until its publish date', async () => {
    const publishedAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const res = await createPost({ ...draft, status: 'SCHEDULED', publishedAt });

    expect(res.status).toBe(201);
    expect((await api().get(url(`/blogs/slug/${res.body.data.slug}`))).status).toBe(404);
  });

  it('publishing stamps the date once and a later edit keeps every other field', async () => {
    const published = await api()
      .patch(url(`/blogs/${id}`))
      .set(auth)
      .send({
        status: 'PUBLISHED',
        isFeatured: true,
        seo: { metaTitle: 'Custom title', keywords: ['gsap'] },
      });
    expect(published.status).toBe(200);
    const { publishedAt } = published.body.data;
    expect(publishedAt).not.toBeNull();
    expect(published.body.data.seo.metaTitle).toBe('Custom title');

    const edited = await api()
      .patch(url(`/blogs/${id}`))
      .set(auth)
      .send({ excerpt: 'Short' });
    expect(edited.body.data).toMatchObject({
      status: 'PUBLISHED',
      isFeatured: true,
      publishedAt,
      excerpt: 'Short',
    });
    expect(edited.body.data.seo.metaTitle).toBe('Custom title');
  });

  it('lets visitors read a published post, and leaves content out of lists', async () => {
    const detail = await api().get(url(`/blogs/slug/${slug}`));
    expect(detail.status).toBe(200);
    expect(detail.body.data.content).toContain('world');

    const list = await api().get(url('/blogs')).query({ search: title });
    expect(list.body.meta.total).toBe(1);
    expect(list.body.data[0]).not.toHaveProperty('content');
  });

  it('counts views for public posts only', async () => {
    await api()
      .post(url(`/blogs/slug/${slug}/view`))
      .expect(200);
    await api()
      .post(url(`/blogs/slug/${slug}-2/view`))
      .expect(200);

    const [live, hidden] = await Promise.all([
      prisma.post.findUnique({ where: { slug } }),
      prisma.post.findUnique({ where: { slug: `${slug}-2` } }),
    ]);
    expect(live?.views).toBe(1);
    expect(hidden?.views).toBe(0);
  });

  it('filters by tag slug', async () => {
    const tag = await api()
      .post(url('/tags'))
      .set(auth)
      .send({ name: unique('gsap') });
    await api()
      .patch(url(`/blogs/${id}`))
      .set(auth)
      .send({ tagIds: [tag.body.data.id] });

    const res = await api().get(url('/blogs')).query({ tag: tag.body.data.slug });
    expect(res.body.data.map((post: { id: string }) => post.id)).toEqual([id]);

    await api()
      .delete(url(`/tags/${tag.body.data.id}`))
      .set(auth)
      .expect(200);
  });

  it('deleting a post removes its SEO record', async () => {
    await api()
      .delete(url(`/blogs/${id}`))
      .set(auth)
      .expect(200);
    expect(await prisma.seo.count({ where: { postId: id } })).toBe(0);
  });
});

describe('clearing optional fields', () => {
  it('stores null when a PATCH sends an empty value, and leaves absent fields alone', async () => {
    const admin = await createTestAdmin();
    const create = await api().post(url('/testimonials')).set(admin.auth).send({
      name: 'Clear Test',
      message: 'A long enough message.',
      company: 'Acme',
      role: 'CTO',
    });
    const { id } = create.body.data;

    const res = await api()
      .patch(url(`/testimonials/${id}`))
      .set(admin.auth)
      .send({ company: '' });
    expect(res.body.data).toMatchObject({ company: null, role: 'CTO' });

    await api()
      .delete(url(`/testimonials/${id}`))
      .set(admin.auth)
      .expect(200);
    await prisma.auditLog.deleteMany({ where: { userId: admin.user.id } });
    await prisma.user.delete({ where: { id: admin.user.id } });
  });
});
