import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { ApiError, type FieldErrors } from '@/common/utils/api-error';
import { logger } from '@/lib/logger';

function fromZod(error: ZodError): ApiError {
  const fields: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root';
    fields[key] ??= issue.message;
  }
  return ApiError.validation(fields);
}

function fromPrisma(error: Prisma.PrismaClientKnownRequestError): ApiError | null {
  switch (error.code) {
    case 'P2002': {
      const target = error.meta?.target;
      const columns = Array.isArray(target) ? target.map(String) : [];
      const fields = Object.fromEntries(columns.map((column) => [column, 'Already in use']));
      return ApiError.conflict('A record with this value already exists', fields);
    }
    case 'P2025':
      return ApiError.notFound();
    case 'P2003':
      return ApiError.badRequest('This record is referenced by, or references, a missing record');
    default:
      return null;
  }
}

function normalize(error: unknown): ApiError | null {
  if (error instanceof ApiError) return error;
  if (error instanceof ZodError) return fromZod(error);
  if (error instanceof Prisma.PrismaClientKnownRequestError) return fromPrisma(error);
  if (error instanceof MulterError) {
    return ApiError.badRequest(
      error.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : `Upload failed: ${error.message}`,
    );
  }
  if (error instanceof SyntaxError && 'body' in error) {
    return ApiError.badRequest('Request body is not valid JSON');
  }
  return null;
}

export const notFoundHandler: RequestHandler = (req) => {
  throw ApiError.notFound(`Route ${req.method} ${req.path}`);
};

// Express identifies error handlers by their four-argument signature.
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const known = normalize(error);

  if (!known) {
    logger.error({ err: error, path: req.path, method: req.method }, 'Unhandled error');
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    });
    return;
  }

  res.status(known.statusCode).json({
    success: false,
    error: { code: known.code, message: known.message, fields: known.fields },
  });
};
