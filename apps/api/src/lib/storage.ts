import { randomBytes } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/config/env';
import { ApiError } from '@/common/utils/api-error';
import { isServerless } from './runtime';

export interface UploadOptions {
  folder: string;
  /** File extension without the dot, taken from the detected file type. */
  extension: string;
}

export interface StoredFile {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

interface StorageProvider {
  upload(buffer: Buffer, options: UploadOptions): Promise<StoredFile>;
  remove(publicId: string): Promise<void>;
}

export const LOCAL_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
export const LOCAL_UPLOAD_ROUTE = '/uploads';

const cloudinaryProvider = (): StorageProvider => {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return {
    upload: (buffer, { folder }) =>
      new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: `portfolio/${folder}`, resource_type: 'auto' },
            (error, result) => {
              if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'));
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
              });
            },
          )
          .end(buffer);
      }),

    async remove(publicId) {
      await cloudinary.uploader.destroy(publicId, { invalidate: true });
    },
  };
};

/** Development fallback: files are written to ./uploads and served by the API. */
const localProvider: StorageProvider = {
  async upload(buffer, { folder, extension }) {
    // A serverless file system is read-only and does not outlive the request.
    if (isServerless) {
      throw new ApiError(
        503,
        'STORAGE_NOT_CONFIGURED',
        'File uploads need Cloudinary on this server. Set the CLOUDINARY_* environment variables.',
      );
    }
    const publicId = `${folder}/${randomBytes(12).toString('hex')}.${extension}`;
    const target = path.join(LOCAL_UPLOAD_DIR, publicId);

    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, buffer);

    return { url: `${env.API_PUBLIC_URL}${LOCAL_UPLOAD_ROUTE}/${publicId}`, publicId };
  },

  async remove(publicId) {
    const target = path.resolve(LOCAL_UPLOAD_DIR, publicId);
    // Never delete outside the upload directory, whatever the stored id says.
    if (!target.startsWith(LOCAL_UPLOAD_DIR + path.sep)) return;
    await rm(target, { force: true });
  },
};

export const usesCloudinary = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
);

export const storage: StorageProvider = usesCloudinary ? cloudinaryProvider() : localProvider;
