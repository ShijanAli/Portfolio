import multer from 'multer';

/**
 * Vercel rejects request bodies over 4.5 MB before they reach the code, so the limit
 * stays under that (the multipart wrapper adds a little). Plenty for web images.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Parses one multipart file named "file" into memory (req.file). */
export const uploadSingle = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
}).single('file');
