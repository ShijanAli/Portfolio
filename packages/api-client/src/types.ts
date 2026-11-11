export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** The list query contract understood by every list endpoint. */
export interface ListQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  [filter: string]: string | number | boolean | undefined;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

export interface ApiFailure {
  success: false;
  error: { code: string; message: string; fields?: Record<string, string> };
}

/** Every record the API returns has a string id. */
export interface Entity {
  id: string;
}

/**
 * The JSON shape of a server-side type: dates and decimals arrive as strings.
 * Lets the admin and website reuse the API's own model types instead of redefining them.
 */
export type Serialized<T> = T extends Date
  ? string
  : T extends { toFixed: unknown; toDecimalPlaces: unknown }
    ? string
    : T extends (infer U)[]
      ? Serialized<U>[]
      : T extends object
        ? { [K in keyof T]: Serialized<T[K]> }
        : T;
