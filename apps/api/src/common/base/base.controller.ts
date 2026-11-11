import type { Request, Response } from 'express';
import { created, ok } from '@/common/utils/api-response';
import type { ListQuery } from '@/common/utils/query-builder';
import type { BaseService, Where } from './base.service';

export interface CrudControllerOptions {
  /**
   * Applied to reads when the request is anonymous, e.g. `{ isActive: true }`.
   * Use a function when the scope depends on the current time.
   */
  publicScope?: Where | (() => Where);
}

/** Route params are validated by Zod before any handler runs. */
const idOf = (req: Request) => String(req.params.id);
const slugOf = (req: Request) => String(req.params.slug);

/**
 * Builds the standard handler set for a service. Express 5 forwards rejected promises to
 * the error handler, so handlers need no try/catch or wrapper.
 */
export function createCrudController<TModel, TCreate, TUpdate>(
  service: BaseService<TModel, TCreate, TUpdate>,
  options: CrudControllerOptions = {},
) {
  const publicScope = () =>
    typeof options.publicScope === 'function' ? options.publicScope() : options.publicScope;

  /** Signed-in staff see everything; visitors only see what the public scope allows. */
  const scopeFor = (req: Request) => (req.user ? undefined : publicScope());

  return {
    list: async (req: Request, res: Response) => {
      const { items, meta } = await service.list(req.query as ListQuery, scopeFor(req));
      ok(res, items, { meta });
    },

    getById: async (req: Request, res: Response) => {
      ok(res, await service.getById(idOf(req), scopeFor(req)));
    },

    getBySlug: async (req: Request, res: Response) => {
      ok(res, await service.getBySlug(slugOf(req), scopeFor(req)));
    },

    /** Only ever counts publicly visible items. */
    recordView: async (req: Request, res: Response) => {
      await service.incrementViews(slugOf(req), publicScope());
      ok(res, null);
    },

    create: async (req: Request, res: Response) => {
      created(res, await service.create(req.body as TCreate));
    },

    update: async (req: Request, res: Response) => {
      ok(res, await service.update(idOf(req), req.body as TUpdate));
    },

    remove: async (req: Request, res: Response) => {
      await service.remove(idOf(req));
      ok(res, null, { message: 'Deleted' });
    },

    removeMany: async (req: Request, res: Response) => {
      const { ids } = req.body as { ids: string[] };
      ok(res, await service.removeMany(ids));
    },
  };
}

export type CrudController = ReturnType<typeof createCrudController>;
