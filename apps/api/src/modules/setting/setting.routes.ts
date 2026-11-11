import { Router } from 'express';
import { authenticate } from '@/common/middlewares/authenticate';
import { authorize } from '@/common/middlewares/authorize';
import { validate } from '@/common/middlewares/validate';
import { settingController } from './setting.controller';
import { settingKeyParamSchema } from './setting.schema';

const router = Router();
const key = validate({ params: settingKeyParamSchema });

// Public: the website reads its configuration from here.
router.get('/', settingController.getAll);
router.get('/:key', key, settingController.get);

// The body is validated in the service, because its schema depends on the key.
router.put('/:key', authenticate, authorize('ADMIN'), key, settingController.update);

export default router;
