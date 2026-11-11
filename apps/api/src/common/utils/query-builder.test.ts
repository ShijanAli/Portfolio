import { describe, expect, it } from 'vitest';
import { buildListArgs, buildMeta } from './query-builder';

const options = {
  searchFields: ['name', 'company'],
  filterFields: ['isActive'],
  sortFields: ['name', 'order'],
  defaultSort: { field: 'order', order: 'asc' } as const,
};

describe('buildListArgs', () => {
  it('applies defaults when the query is empty', () => {
    expect(buildListArgs({}, options)).toEqual({
      where: {},
      orderBy: { order: 'asc' },
      skip: 0,
      take: 10,
    });
  });

  it('paginates', () => {
    const args = buildListArgs({ page: 3, limit: 20 }, options);
    expect(args.skip).toBe(40);
    expect(args.take).toBe(20);
  });

  it('caps the limit', () => {
    expect(buildListArgs({ limit: 5000 }, options).take).toBe(100);
  });

  it('searches every search field case-insensitively', () => {
    expect(buildListArgs({ search: 'acme' }, options).where).toEqual({
      OR: [
        { name: { contains: 'acme', mode: 'insensitive' } },
        { company: { contains: 'acme', mode: 'insensitive' } },
      ],
    });
  });

  it('only filters by whitelisted fields', () => {
    const { where } = buildListArgs({ isActive: false, passwordHash: 'x' }, options);
    expect(where).toEqual({ isActive: false });
  });

  it('ignores sort fields that are not whitelisted', () => {
    expect(buildListArgs({ sort: 'passwordHash', order: 'desc' }, options).orderBy).toEqual({
      order: 'asc',
    });
    expect(buildListArgs({ sort: 'name', order: 'desc' }, options).orderBy).toEqual({
      name: 'desc',
    });
  });
});

describe('buildMeta', () => {
  it('computes page info', () => {
    expect(buildMeta(45, { skip: 20, take: 20 })).toEqual({
      page: 2,
      limit: 20,
      total: 45,
      totalPages: 3,
    });
  });

  it('reports one page for an empty result', () => {
    expect(buildMeta(0, { skip: 0, take: 10 }).totalPages).toBe(1);
  });
});
