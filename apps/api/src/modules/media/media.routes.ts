import { Router } from 'express';
import { createCrudRouter } from '@/common/base/create-crud-router';
import { authenticate } from '@/common/middlewares/authenticate';
import { authorize } from '@/common/middlewares/authorize';
import { uploadSingle } from '@/common/middlewares/upload';
import { mediaController } from './media.controller';
import { mediaQuerySchema, updateMediaSchema } from './media.schema';

const router = Router();

router.post('/', authenticate, authorize('ADMIN', 'EDITOR'), uploadSingle, mediaController.upload);

// Media library: list, read, edit alt text, delete.
router.use(
  createCrudRouter({
    controller: mediaController,
    schemas: { update: updateMediaSchema, query: mediaQuerySchema },
  }),
);

export default router;
