import type { Serialized } from '@portfolio/api-client';
import type { Media as ApiMedia } from '@portfolio/api/types';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';

export type Media = Serialized<ApiMedia>;

export const MEDIA_FOLDERS = [
  'general',
  'projects',
  'services',
  'blog',
  'avatars',
  'documents',
] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export const isImage = (media: Pick<Media, 'mimeType'>) => media.mimeType.startsWith('image/');

const MEDIA_KEY = 'media';

export function useMediaList(query: {
  page: number;
  limit: number;
  folder?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: [MEDIA_KEY, 'list', query],
    queryFn: () => api.resource<Media>(MEDIA_KEY).list(query),
    placeholderData: keepPreviousData,
  });
}

/** Uploads files one after another and reports each failure by file name. */
export function useMediaUpload(folder: MediaFolder) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (files: File[]) => {
      const uploaded: Media[] = [];
      for (const file of files) {
        const body = new FormData();
        body.append('folder', folder);
        body.append('file', file);
        try {
          uploaded.push(await api.post<Media>('/media', body));
        } catch (error) {
          toast.error(`${file.name}: ${errorMessage(error)}`);
        }
      }
      return uploaded;
    },
    onSuccess: (uploaded) => {
      if (uploaded.length > 0)
        toast.success(`${uploaded.length} file${uploaded.length === 1 ? '' : 's'} uploaded`);
      return queryClient.invalidateQueries({ queryKey: [MEDIA_KEY] });
    },
  });
}

export function useMediaActions() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: [MEDIA_KEY] });
  const failed = (error: unknown) => toast.error(errorMessage(error));

  return {
    remove: useMutation({
      mutationFn: (id: string) => api.resource<Media>(MEDIA_KEY).remove(id),
      onSuccess: () => {
        toast.success('File deleted');
        return refresh();
      },
      onError: failed,
    }),
    updateAlt: useMutation({
      mutationFn: ({ id, alt }: { id: string; alt: string }) =>
        api.resource<Media>(MEDIA_KEY).update(id, { alt }),
      onSuccess: () => {
        toast.success('Description saved');
        return refresh();
      },
      onError: failed,
    }),
  };
}
