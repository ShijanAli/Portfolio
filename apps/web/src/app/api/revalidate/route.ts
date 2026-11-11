import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

const TAG_PATTERN = /^[a-z][a-z-]{1,40}$/;

function isAuthorized(request: Request): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  const given = request.headers.get('x-revalidate-secret');
  if (!expected || !given || expected.length !== given.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(given));
}

/**
 * Called by the API after content changes in the admin. Marks the cached data with the
 * given tags as stale, so the next visitor gets a freshly rendered page.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ revalidated: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = Array.isArray(body?.tags)
    ? body.tags.filter((tag): tag is string => typeof tag === 'string' && TAG_PATTERN.test(tag))
    : [];

  // `expire: 0` drops the cached entry at once instead of serving it one more time.
  tags.forEach((tag) => revalidateTag(tag, { expire: 0 }));
  return NextResponse.json({ revalidated: true, tags });
}
