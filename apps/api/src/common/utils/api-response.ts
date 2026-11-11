import type { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SuccessBody<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

function send<T>(res: Response, status: number, data: T, extra: Partial<SuccessBody<T>> = {}) {
  const body: SuccessBody<T> = { success: true, data, ...extra };
  return res.status(status).json(body);
}

export const ok = <T>(
  res: Response,
  data: T,
  extra?: { meta?: PaginationMeta; message?: string },
) => send(res, 200, data, extra);

export const created = <T>(res: Response, data: T, message?: string) =>
  send(res, 201, data, { message });
