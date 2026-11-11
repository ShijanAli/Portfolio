import type { Role } from '@prisma/client';
import type { RequestHandler } from 'express';
import { ApiError } from '@/common/utils/api-error';

/** Must run after `authenticate`. */
export const authorize =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) throw ApiError.forbidden();
    next();
  };
