import { z } from 'zod';
import { optionalText } from '@/common/schemas/common.schema';
import { paginationSchema } from '@/common/schemas/pagination.schema';

export const MEDIA_FOLDERS = [
  'general',
  'projects',
  'services',
  'blog',
  'avatars',
  'documents',
] as const;

const folderSchema = z.enum(MEDIA_FOLDERS);

/** Text fields that accompany the file in the multipart upload. */
export const uploadMediaSchema = z.object({
  folder: folderSchema.default('general'),
  alt: optionalText(200),
});

export const updateMediaSchema = z.object({
  alt: optionalText(200),
});

export const mediaQuerySchema = paginationSchema.extend({
  folder: folderSchema.optional(),
});

export type UploadMediaInput = z.infer<typeof uploadMediaSchema>;
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
