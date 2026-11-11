import type { Entity, ListQuery } from '@portfolio/api-client';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';

/** One page of a resource. The previous page stays visible while the next one loads. */
export function useResourceList<T extends Entity>(path: string, query: ListQuery) {
  return useQuery({
    queryKey: [path, 'list', query],
    queryFn: () => api.resource<T>(path).list(query),
    placeholderData: keepPreviousData,
  });
}

/** One full record, e.g. for an edit page. List rows can leave out heavy fields. */
export function useResourceItem<T extends Entity>(path: string, id: string | undefined) {
  return useQuery({
    queryKey: [path, 'detail', id],
    queryFn: () => api.resource<T>(path).get(id ?? ''),
    enabled: Boolean(id),
    // Always edit the latest version, never a cached one.
    staleTime: 0,
    gcTime: 0,
  });
}

/**
 * Create, update and delete for a resource. Every success refreshes the resource's lists
 * and confirms with a toast. Create and update leave error display to the form, which
 * shows the API's field errors next to the inputs.
 */
export function useResourceMutations<T extends Entity>(path: string, singular: string) {
  const queryClient = useQueryClient();
  const resource = api.resource<T>(path);
  const label = singular.charAt(0).toUpperCase() + singular.slice(1);

  const done = (message: string) => () => {
    toast.success(message);
    return queryClient.invalidateQueries({ queryKey: [path] });
  };
  const failed = (error: unknown) => toast.error(errorMessage(error));

  return {
    create: useMutation({
      mutationFn: (body: Record<string, unknown>) => resource.create(body),
      onSuccess: done(`${label} created`),
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
        resource.update(id, body),
      onSuccess: done(`${label} updated`),
    }),
    remove: useMutation({
      mutationFn: (id: string) => resource.remove(id),
      onSuccess: done(`${label} deleted`),
      onError: failed,
    }),
    removeMany: useMutation({
      mutationFn: (ids: string[]) => resource.removeMany(ids),
      onSuccess: done('Selected items deleted'),
      onError: failed,
    }),
  };
}
