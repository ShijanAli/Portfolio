import { Router } from 'express';
import { createCrudRouter } from '@/common/base/create-crud-router';
import { authenticate } from '@/common/middlewares/authenticate';
import { authorize } from '@/common/middlewares/authorize';
import { subscriberController as controller } from './subscriber.controller';
import { subscriberQuerySchema, updateSubscriberSchema } from './subscriber.schema';

const router = Router();
const admin = [authenticate, authorize('ADMIN')];

router.get('/stats', ...admin, controller.stats);
router.get('/export', ...admin, controller.exportCsv);

// People join through the public newsletter form, so there is no create route.
router.use(
  createCrudRouter({
    controller,
    schemas: { update: updateSubscriberSchema, query: subscriberQuerySchema },
    roles: ['ADMIN'],
  }),
);

export default router;
