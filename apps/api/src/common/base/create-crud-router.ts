import type { Role } from '@prisma/client';
import { Router, type RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { authenticate, optionalAuth } from '@/common/middlewares/authenticate';
import { authorize } from '@/common/middlewares/authorize';
import { viewLimiter } from '@/common/middlewares/rate-limit';
import { validate } from '@/common/middlewares/validate';
import { bulkIdsSchema, idParamSchema, slugParamSchema } from '@/common/schemas/id.schema';
import type { CrudController } from './base.controller';

export interface CrudRouterOptions {
  controller: CrudController;
  /** Leave out `create` or `update` for resources that are not written through CRUD. */
  schemas: { query: ZodType; create?: ZodType; update?: ZodType };
  /** When true, GET routes are open to visitors (limited by the controller's publicScope). */
  publicRead?: boolean;
  /** Adds `GET /slug/:slug` for resources addressed by slug on the public site. */
  slugRoute?: boolean;
  /** Adds `POST /slug/:slug/view` (requires a `views` column). */
  viewCounter?: boolean;
  /** Roles allowed to read (when not public) and write. */
  roles?: Role[];
}

const DEFAULT_ROLES: Role[] = ['ADMIN', 'EDITOR'];

/** Standard REST routes for a resource: list, get, create, update, delete, bulk delete. */
export function createCrudRouter(options: CrudRouterOptions): Router {
  const { controller, schemas, publicRead = false, roles = DEFAULT_ROLES } = options;

  const guard: RequestHandler[] = [authenticate, authorize(...roles)];
  const readGuard: RequestHandler[] = publicRead ? [optionalAuth] : guard;
  const idParams = validate({ params: idParamSchema });
  const slugParams = validate({ params: slugParamSchema });

  const router = Router();

  router.get('/', ...readGuard, validate({ query: schemas.query }), controller.list);

  if (options.slugRoute) {
    router.get('/slug/:slug', ...readGuard, slugParams, controller.getBySlug);
  }
  if (options.viewCounter) {
    router.post('/slug/:slug/view', viewLimiter, slugParams, controller.recordView);
  }

  router.get('/:id', ...readGuard, idParams, controller.getById);

  if (schemas.create) {
    router.post('/', ...guard, validate({ body: schemas.create }), controller.create);
  }
  router.post('/bulk-delete', ...guard, validate({ body: bulkIdsSchema }), controller.removeMany);
  if (schemas.update) {
    router.patch(
      '/:id',
      ...guard,
      validate({ params: idParamSchema, body: schemas.update }),
      controller.update,
    );
  }
  router.delete('/:id', ...guard, idParams, controller.remove);

  return router;
}
