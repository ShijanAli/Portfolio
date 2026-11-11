import multer from 'multer';

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** Parses one multipart file named "file" into memory (req.file). */
export const uploadSingle = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
}).single('file');
