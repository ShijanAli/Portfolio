import type { Serialized } from '@portfolio/api-client';
import type { PublicUser } from '@portfolio/api/types';
import { create } from 'zustand';

export type SessionUser = Serialized<PublicUser>;

interface SessionState {
  /** `loading` until the first attempt to restore the session has finished. */
  status: 'loading' | 'authenticated' | 'anonymous';
  user: SessionUser | null;
  /** Kept in memory only. The long-lived refresh token is an httpOnly cookie. */
  accessToken: string | null;
  setSession: (session: { user: SessionUser; accessToken: string }) => void;
  clearSession: () => void;
}

export const useSession = create<SessionState>((set) => ({
  status: 'loading',
  user: null,
  accessToken: null,
  setSession: ({ user, accessToken }) => set({ status: 'authenticated', user, accessToken }),
  clearSession: () => set({ status: 'anonymous', user: null, accessToken: null }),
}));
