import type { Request, RequestHandler } from 'express';
import { ApiError } from '@/common/utils/api-error';
import { verifyAccessToken } from '@/common/utils/jwt';

function resolveUser(req: Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return verifyAccessToken(header.slice('Bearer '.length));
}

/** Requires a valid access token. */
export const authenticate: RequestHandler = (req, _res, next) => {
  const user = resolveUser(req);
  if (!user) throw ApiError.unauthorized();
  req.user = user;
  next();
};

/** Attaches the user when a valid token is present, but lets anonymous requests through. */
export const optionalAuth: RequestHandler = (req, _res, next) => {
  req.user = resolveUser(req) ?? undefined;
  next();
};
