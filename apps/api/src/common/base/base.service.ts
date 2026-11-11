import { ApiError } from '@/common/utils/api-error';
import type { PaginationMeta } from '@/common/utils/api-response';
import {
  buildListArgs,
  buildMeta,
  type ListQuery,
  type QueryOptions,
} from '@/common/utils/query-builder';
import { slugify } from '@/common/utils/slugify';

export type Where = Record<string, unknown>;

/**
 * The subset of a Prisma model delegate that the generic CRUD needs. Prisma's generated
 * delegate types are not assignable to one another, so the boundary is typed loosely here
 * and strictly (TModel / TCreate / TUpdate) on the service's public methods.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface CrudDelegate {
  findMany(args?: any): Promise<any[]>;
  findFirst(args?: any): Promise<any>;
  count(args?: any): Promise<number>;
  create(args: any): Promise<any>;
  update(args: any): Promise<any>;
  updateMany(args: any): Promise<{ count: number }>;
  delete(args: any): Promise<any>;
  deleteMany(args?: any): Promise<{ count: number }>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface CrudOptions extends QueryOptions {
  /** Human readable name used in error messages, e.g. "Testimonial". */
  resource: string;
  /** Relations to load with every read. */
  include?: Record<string, unknown>;
  /** Columns never returned by this service, e.g. secret tokens. */
  omit?: Record<string, boolean>;
  /** Heavy columns additionally left out of list responses, e.g. `{ content: true }`. */
  listOmit?: Record<string, boolean>;
  /** Input field a slug is generated from when the client does not send one. */
  slugFrom?: string;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

const MAX_SLUG_ATTEMPTS = 50;

/**
 * Generic CRUD for one Prisma model. Simple modules instantiate it directly; modules with
 * business rules extend it and override `prepareCreate` / `prepareUpdate` or add methods.
 */
export class BaseService<TModel, TCreate, TUpdate = Partial<TCreate>> {
  constructor(
    protected readonly delegate: CrudDelegate,
    protected readonly options: CrudOptions,
  ) {}

  /** Hook: map validated input to Prisma `data` (connect relations, derive fields...). */
  protected async prepareCreate(input: TCreate): Promise<unknown> {
    return input;
  }

  protected async prepareUpdate(input: TUpdate, _id: string): Promise<unknown> {
    return input;
  }

  /** Hook: filters that need more than column equality, e.g. by a relation's slug. */
  protected extraWhere(_query: ListQuery): Where {
    return {};
  }

  async list(query: ListQuery, scope?: Where): Promise<Paginated<TModel>> {
    const args = buildListArgs(query, this.options);
    const where = { AND: [args.where, this.extraWhere(query), scope ?? {}] };
    const { include } = this.options;
    const omit = { ...this.options.omit, ...this.options.listOmit };

    const [items, total] = await Promise.all([
      this.delegate.findMany({ ...args, where, include, omit }),
      this.delegate.count({ where }),
    ]);

    return { items, meta: buildMeta(total, args) };
  }

  /** `scope` narrows visibility, e.g. `{ isActive: true }` for anonymous visitors. */
  async getById(id: string, scope?: Where): Promise<TModel> {
    return this.findOneOrThrow({ AND: [{ id }, scope ?? {}] });
  }

  async getBySlug(slug: string, scope?: Where): Promise<TModel> {
    return this.findOneOrThrow({ AND: [{ slug }, scope ?? {}] });
  }

  async incrementViews(slug: string, scope?: Where): Promise<void> {
    await this.delegate.updateMany({
      where: { AND: [{ slug }, scope ?? {}] },
      data: { views: { increment: 1 } },
    });
  }

  async create(input: TCreate): Promise<TModel> {
    const withSlug = await this.withSlug(input);
    const data = await this.prepareCreate(withSlug);
    return this.delegate.create({ data, ...this.readArgs() });
  }

  async update(id: string, input: TUpdate): Promise<TModel> {
    await this.findOneOrThrow({ id });
    const data = await this.prepareUpdate(input, id);
    return this.delegate.update({ where: { id }, data, ...this.readArgs() });
  }

  async remove(id: string): Promise<void> {
    await this.findOneOrThrow({ id });
    await this.delegate.delete({ where: { id } });
  }

  async removeMany(ids: string[]): Promise<{ count: number }> {
    return this.delegate.deleteMany({ where: { id: { in: ids } } });
  }

  private readArgs() {
    return { include: this.options.include, omit: this.options.omit };
  }

  protected async findOneOrThrow(where: Where): Promise<TModel> {
    const record = await this.delegate.findFirst({ where, ...this.readArgs() });
    if (!record) throw ApiError.notFound(this.options.resource);
    return record;
  }

  /**
   * An explicit slug is kept as sent (a clash surfaces as a 409). A missing slug is
   * generated from `slugFrom` and suffixed (-2, -3...) until it is free.
   */
  private async withSlug(input: TCreate): Promise<TCreate> {
    const { slugFrom } = this.options;
    if (!slugFrom) return input;

    const fields = input as Record<string, unknown>;
    if (typeof fields.slug === 'string' && fields.slug) return input;

    const base = slugify(String(fields[slugFrom] ?? '')) || 'item';
    for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt += 1) {
      const slug = attempt === 1 ? base : `${base}-${attempt}`;
      const taken = await this.delegate.count({ where: { slug } });
      if (taken === 0) return { ...input, slug };
    }
    throw ApiError.conflict('Could not generate a unique slug, please provide one');
  }
}
