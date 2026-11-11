import type { CookieOptions, Request, Response } from 'express';
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH } from '@/config/constants';
import { isProduction } from '@/config/env';
import { ApiError } from '@/common/utils/api-error';
import { ok } from '@/common/utils/api-response';
import { auditLogService } from '@/modules/audit-log/audit-log.service';
import { authService, type AuthResult, type ClientContext } from './auth.service';

// The refresh token never reaches JavaScript: httpOnly cookie scoped to the auth routes.
// SameSite=Lax assumes the admin panel and the API share a registrable domain.
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: REFRESH_COOKIE_PATH,
};

const contextOf = (req: Request): ClientContext => ({
  ip: req.ip,
  userAgent: req.get('user-agent'),
});

const readRefreshCookie = (req: Request): string | undefined => req.cookies?.[REFRESH_COOKIE_NAME];

function sendSession(res: Response, result: AuthResult) {
  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
    ...cookieOptions,
    expires: result.refreshExpiresAt,
  });
  ok(res, { user: result.user, accessToken: result.accessToken });
}

function requireUserId(req: Request): string {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
}

export const authController = {
  login: async (req: Request, res: Response) => {
    const session = await authService.login(req.body, contextOf(req));
    auditLogService.record({ userId: session.user.id, action: 'LOGIN', entity: 'auth' });
    sendSession(res, session);
  },

  refresh: async (req: Request, res: Response) => {
    sendSession(res, await authService.refresh(readRefreshCookie(req), contextOf(req)));
  },

  logout: async (req: Request, res: Response) => {
    await authService.logout(readRefreshCookie(req));
    res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);
    ok(res, null, { message: 'Logged out' });
  },

  me: async (req: Request, res: Response) => {
    ok(res, await authService.getProfile(requireUserId(req)));
  },

  changePassword: async (req: Request, res: Response) => {
    await authService.changePassword(requireUserId(req), req.body);
    res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);
    ok(res, null, { message: 'Password changed. Please log in again.' });
  },
};
