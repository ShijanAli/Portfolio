import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { toUpdateSchema } from './common.schema';

const createSchema = z.object({
  name: z.string().min(2),
  rating: z.number().default(5),
  isActive: z.boolean().default(true),
});

describe('toUpdateSchema', () => {
  const updateSchema = toUpdateSchema(createSchema);

  it('does not inject defaults for fields the client did not send', () => {
    expect(updateSchema.parse({ name: 'John' })).toEqual({ name: 'John' });
  });

  it('accepts an empty patch', () => {
    expect(updateSchema.parse({})).toEqual({});
  });

  it('still validates the fields that are sent', () => {
    expect(updateSchema.safeParse({ name: 'J' }).success).toBe(false);
    expect(updateSchema.parse({ isActive: false })).toEqual({ isActive: false });
  });

  it('leaves the create schema defaults intact', () => {
    expect(createSchema.parse({ name: 'John' })).toEqual({
      name: 'John',
      rating: 5,
      isActive: true,
    });
  });
});
