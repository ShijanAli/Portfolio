import { Router } from 'express';
import { createCrudRouter } from '@/common/base/create-crud-router';
import { authenticate } from '@/common/middlewares/authenticate';
import { authorize } from '@/common/middlewares/authorize';
import { validate } from '@/common/middlewares/validate';
import { idParamSchema } from '@/common/schemas/id.schema';
import { campaignController as controller } from './campaign.controller';
import {
  campaignQuerySchema,
  createCampaignSchema,
  testCampaignSchema,
  updateCampaignSchema,
} from './campaign.schema';

const router = Router();
const admin = [authenticate, authorize('ADMIN')];
const id = validate({ params: idParamSchema });

router.get('/:id/stats', ...admin, id, controller.stats);
router.post('/:id/send', ...admin, id, controller.send);
router.post(
  '/:id/test',
  ...admin,
  validate({ params: idParamSchema, body: testCampaignSchema }),
  controller.sendTest,
);

router.use(
  createCrudRouter({
    controller,
    schemas: {
      create: createCampaignSchema,
      update: updateCampaignSchema,
      query: campaignQuerySchema,
    },
    roles: ['ADMIN'],
  }),
);

export default router;
