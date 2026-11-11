export const API_PREFIX = '/api/v1';

export const REFRESH_COOKIE_NAME = 'refresh_token';
export const REFRESH_COOKIE_PATH = `${API_PREFIX}/auth`;

export const PAGINATION = {
  defaultLimit: 10,
  maxLimit: 100,
} as const;
