import { isApiError } from '@portfolio/api-client';

export const errorMessage = (error: unknown) =>
  isApiError(error) ? error.message : 'Something went wrong. Please try again.';
