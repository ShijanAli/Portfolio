import type { Request, Response } from 'express';
import { createCrudController } from '@/common/base/base.controller';
import { created } from '@/common/utils/api-response';
import { uploadMediaSchema } from './media.schema';
import { mediaService } from './media.service';

export const mediaController = {
  ...createCrudController(mediaService),

  upload: async (req: Request, res: Response) => {
    // Multipart text fields are only available after multer has run, so they are parsed here.
    const input = uploadMediaSchema.parse(req.body ?? {});
    created(res, await mediaService.upload(req.file, input));
  },
};
