import { createApiClient } from '@portfolio/api-client';
import { useSession, type SessionUser } from './session';

interface SessionPayload {
  user: SessionUser;
  accessToken: string;
}

const REFRESH_LOCK = 'portfolio-admin-refresh';

export const api = createApiClient({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1',
  getToken: () => useSession.getState().accessToken,
  onUnauthorized: () => refreshSession(),
});

async function requestRefresh(): Promise<boolean> {
  try {
    const session = await api.post<SessionPayload>('/auth/refresh', undefined, {
      skipAuthRetry: true,
    });
    useSession.getState().setSession(session);
    return true;
  } catch {
    useSession.getState().clearSession();
    return false;
  }
}

let pendingRefresh: Promise<boolean> | null = null;

/**
 * Exchanges the refresh cookie for a new access token.
 *
 * Refresh tokens are single-use, and the server treats a reused one as stolen. So parallel
 * requests in this tab share one refresh, and a Web Lock makes other tabs wait their turn.
 */
export function refreshSession(): Promise<boolean> {
  if (pendingRefresh) return pendingRefresh;

  const refresh = async (): Promise<boolean> =>
    navigator.locks
      ? await navigator.locks.request(REFRESH_LOCK, requestRefresh)
      : requestRefresh();

  pendingRefresh = refresh().finally(() => {
    pendingRefresh = null;
  });
  return pendingRefresh;
}

export async function login(credentials: { email: string; password: string }): Promise<void> {
  const session = await api.post<SessionPayload>('/auth/login', credentials, {
    skipAuthRetry: true,
  });
  useSession.getState().setSession(session);
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout', undefined, { skipAuthRetry: true }).catch(() => undefined);
  useSession.getState().clearSession();
}
