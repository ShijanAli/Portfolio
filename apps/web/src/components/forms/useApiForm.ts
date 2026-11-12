'use client';

import { ApiError } from '@portfolio/api-client';
import { useState, type FormEvent } from 'react';
import { PUBLIC_API_URL } from '@/lib/env';

type Status = 'idle' | 'submitting' | 'success' | 'error';

interface FormState<T> {
  status: Status;
  /** Success or general error text to show under the form. */
  message: string;
  /** Per-field validation messages from the API, keyed by field name. */
  fieldErrors: Record<string, string>;
  /** What the API returned on success. */
  data: T | null;
}

interface Options<T> {
  successMessage: string;
  /** Values sent along with the form's own fields. */
  extra?: object;
  method?: 'POST' | 'PUT';
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
}

/** Sends JSON to the public API and turns any failure into an ApiError. */
export async function sendToApi<T>(
  path: string,
  body?: object,
  method = 'POST',
): Promise<{ data: T; message?: string }> {
  let response: Response;
  try {
    response = await fetch(`${PUBLIC_API_URL}${path}`, {
      method,
      // A redirect would silently turn this POST into a GET (and drop the form data).
      // Stop at the redirect and report it instead.
      redirect: 'manual',
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Could not reach the server. Please check your connection.',
    );
  }

  if (response.type === 'opaqueredirect') {
    throw new ApiError(
      0,
      'API_REDIRECTS',
      'The API address is redirecting to another URL. Set NEXT_PUBLIC_API_URL to the final address (check http vs https, www, and the /api/v1 path).',
    );
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'ERROR',
      error?.message ?? '',
      error?.fields,
    );
  }
  return { data: payload?.data as T, message: payload?.message };
}

/** What to tell a visitor when a request fails. */
export function describeError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Something went wrong. Please try again.';
  if (Object.keys(error.fields).length > 0) return 'Please check the highlighted fields.';
  if (error.status === 429) return 'Too many attempts. Please try again later.';
  // The API writes its 4xx messages for visitors (e.g. "This time is no longer available").
  if (error.status >= 400 && error.status < 500 && error.message) return error.message;
  return error.status === 0 ? error.message : 'Something went wrong. Please try again.';
}

const initialState = <T>(): FormState<T> => ({
  status: 'idle',
  message: '',
  fieldErrors: {},
  data: null,
});

/**
 * Submits a public form to the API as JSON and tracks what to show the visitor.
 * Validation lives in the API; its per-field messages are returned as `fieldErrors`.
 * Every public form (newsletter, contact, booking) uses this.
 */
export function useApiForm<T = null>(path: string, options: Options<T>) {
  const [state, setState] = useState<FormState<T>>(initialState);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setState({ ...initialState<T>(), status: 'submitting' });

    try {
      const body = { ...Object.fromEntries(new FormData(form)), ...options.extra };
      const result = await sendToApi<T>(path, body, options.method);
      form.reset();
      setState({
        status: 'success',
        message: result.message ?? options.successMessage,
        fieldErrors: {},
        data: result.data,
      });
      options.onSuccess?.(result.data);
    } catch (error) {
      setState({
        status: 'error',
        message: describeError(error),
        fieldErrors: error instanceof ApiError ? error.fields : {},
        data: null,
      });
      if (error instanceof ApiError) options.onError?.(error);
    }
  };

  return { ...state, isSubmitting: state.status === 'submitting', onSubmit };
}
