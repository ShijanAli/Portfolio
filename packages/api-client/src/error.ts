/** A failed API call, carrying the server's error code and per-field messages. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isUnauthorized() {
    return this.status === 401;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;
