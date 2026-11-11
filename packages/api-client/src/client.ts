import { ApiError } from './error';
import type { ApiFailure, ApiSuccess, Entity, ListQuery, Paginated } from './types';

export interface ApiClientOptions {
  /** e.g. "http://localhost:4000/api/v1" */
  baseUrl: string;
  /** Current access token, if the user is signed in. */
  getToken?: () => string | null;
  /**
   * Called once when a request is rejected with 401. Return true after obtaining a new
   * token to have the request retried.
   */
  onUnauthorized?: () => Promise<boolean>;
}

interface RequestOptions {
  query?: object;
  body?: unknown;
  /** Skip the 401 refresh-and-retry, e.g. for the login and refresh calls themselves. */
  skipAuthRetry?: boolean;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function toSearch(query: object | undefined): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

export function createApiClient(options: ApiClientOptions) {
  async function send<T>(
    method: Method,
    path: string,
    request: RequestOptions,
  ): Promise<ApiSuccess<T>> {
    const isForm = request.body instanceof FormData;
    const headers: Record<string, string> = {};
    const token = options.getToken?.();
    if (token) headers.authorization = `Bearer ${token}`;
    if (request.body !== undefined && !isForm) headers['content-type'] = 'application/json';

    let response: Response;
    try {
      response = await fetch(`${options.baseUrl}${path}${toSearch(request.query)}`, {
        method,
        headers,
        credentials: 'include',
        body: isForm
          ? (request.body as FormData)
          : request.body === undefined
            ? undefined
            : JSON.stringify(request.body),
      });
    } catch {
      throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Check your connection.');
    }

    const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;
    if (response.ok && payload?.success) return payload;

    const failure = payload && !payload.success ? payload.error : undefined;
    throw new ApiError(
      response.status,
      failure?.code ?? 'UNKNOWN_ERROR',
      failure?.message ?? 'Something went wrong',
      failure?.fields,
    );
  }

  async function request<T>(method: Method, path: string, request: RequestOptions = {}) {
    try {
      return await send<T>(method, path, request);
    } catch (error) {
      const canRetry =
        error instanceof ApiError &&
        error.isUnauthorized &&
        !request.skipAuthRetry &&
        options.onUnauthorized;
      if (canRetry && (await options.onUnauthorized?.())) return send<T>(method, path, request);
      throw error;
    }
  }

  const data = async <T>(method: Method, path: string, options?: RequestOptions) =>
    (await request<T>(method, path, options)).data;

  return {
    /** Full response, including `meta` and `message`. */
    request,
    get: <T>(path: string, query?: object) => data<T>('GET', path, { query }),
    post: <T>(path: string, body?: unknown, extra?: RequestOptions) =>
      data<T>('POST', path, { ...extra, body }),
    put: <T>(path: string, body?: unknown) => data<T>('PUT', path, { body }),
    patch: <T>(path: string, body?: unknown) => data<T>('PATCH', path, { body }),
    delete: <T>(path: string) => data<T>('DELETE', path),

    /** The standard CRUD calls for one resource, e.g. `client.resource<Tag>('tags')`. */
    resource<T extends Entity>(name: string) {
      const base = `/${name}`;
      return {
        async list(query?: ListQuery): Promise<Paginated<T>> {
          const response = await request<T[]>('GET', base, { query });
          return {
            items: response.data,
            meta: response.meta ?? {
              page: 1,
              limit: response.data.length,
              total: response.data.length,
              totalPages: 1,
            },
          };
        },
        get: (id: string) => data<T>('GET', `${base}/${id}`),
        create: (body: unknown) => data<T>('POST', base, { body }),
        update: (id: string, body: unknown) => data<T>('PATCH', `${base}/${id}`, { body }),
        remove: (id: string) => data<null>('DELETE', `${base}/${id}`),
        removeMany: (ids: string[]) =>
          data<{ count: number }>('POST', `${base}/bulk-delete`, { body: { ids } }),
      };
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
