import type { SeoInput } from '@/common/schemas/seo.schema';

/** Prisma nested-write helpers shared by every service that owns relations. */

export const connectIds = (ids: string[]) => ids.map((id) => ({ id }));

/** `undefined` leaves the relation untouched. */
export const createSeo = (seo: SeoInput | undefined) => (seo ? { create: seo } : undefined);

export const upsertSeo = (seo: SeoInput | undefined) =>
  seo ? { upsert: { create: seo, update: seo } } : undefined;

/** Replace a many-to-many set only when the client sent one. */
export const setIds = (ids: string[] | undefined) => (ids ? { set: connectIds(ids) } : undefined);
