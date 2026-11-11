import type { Media } from '@prisma/client';
import { fileTypeFromBuffer } from 'file-type';
import { BaseService } from '@/common/base/base.service';
import { ApiError } from '@/common/utils/api-error';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { storage } from '@/lib/storage';
import type { UpdateMediaInput, UploadMediaInput } from './media.schema';

export interface IncomingFile {
  buffer: Buffer;
  originalname: string;
  size: number;
}

/** SVG is deliberately excluded: it can carry scripts. */
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'application/pdf',
]);

class MediaService extends BaseService<Media, never, UpdateMediaInput> {
  constructor() {
    super(prisma.media, {
      resource: 'File',
      searchFields: ['filename', 'alt'],
      filterFields: ['folder'],
      sortFields: ['filename', 'size', 'createdAt'],
      defaultSort: { field: 'createdAt', order: 'desc' },
    });
  }

  async upload(file: IncomingFile | undefined, input: UploadMediaInput): Promise<Media> {
    if (!file) throw ApiError.validation({ file: 'A file is required' });

    // Trust the file's actual bytes, not the name or content type the client claims.
    const detected = await fileTypeFromBuffer(file.buffer);
    if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
      throw ApiError.validation({
        file: 'Only JPEG, PNG, WebP, AVIF, GIF and PDF files are allowed',
      });
    }

    const stored = await storage.upload(file.buffer, {
      folder: input.folder,
      extension: detected.ext,
    });

    return prisma.media.create({
      data: {
        ...stored,
        filename: file.originalname.slice(0, 200),
        mimeType: detected.mime,
        size: file.size,
        alt: input.alt,
        folder: input.folder,
      },
    });
  }

  override async remove(id: string): Promise<void> {
    const media = await this.getById(id);
    await super.remove(id);
    await this.removeFromStorage([media]);
  }

  override async removeMany(ids: string[]): Promise<{ count: number }> {
    const files = await prisma.media.findMany({ where: { id: { in: ids } } });
    const result = await super.removeMany(ids);
    await this.removeFromStorage(files);
    return result;
  }

  /** The database row is already gone; a storage failure is logged, not surfaced. */
  private async removeFromStorage(files: Media[]) {
    await Promise.all(
      files.map(async ({ publicId }) => {
        if (!publicId) return;
        await storage.remove(publicId).catch((error: unknown) => {
          logger.error({ err: error, publicId }, 'Could not delete file from storage');
        });
      }),
    );
  }
}

export const mediaService = new MediaService();
