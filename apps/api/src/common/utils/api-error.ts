export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly fields?: FieldErrors,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message = 'Bad request', fields?: FieldErrors) {
    return new ApiError(400, 'BAD_REQUEST', message, fields);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'You do not have permission to do this') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(resource = 'Resource') {
    return new ApiError(404, 'NOT_FOUND', `${resource} not found`);
  }

  static conflict(message = 'Resource already exists', fields?: FieldErrors) {
    return new ApiError(409, 'CONFLICT', message, fields);
  }

  static validation(fields: FieldErrors, message = 'Validation failed') {
    return new ApiError(422, 'VALIDATION_ERROR', message, fields);
  }
}
