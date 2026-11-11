import { Router } from 'express';
import { createCrudRouter } from '@/common/base/create-crud-router';
import { authenticate } from '@/common/middlewares/authenticate';
import { authorize } from '@/common/middlewares/authorize';
import { publicFormLimiter } from '@/common/middlewares/rate-limit';
import { validate } from '@/common/middlewares/validate';
import { contactController } from './contact.controller';
import { contactQuerySchema, submitContactSchema, updateContactSchema } from './contact.schema';

const router = Router();

// Public: the website's contact form.
router.post(
  '/',
  publicFormLimiter,
  validate({ body: submitContactSchema }),
  contactController.submit,
);

router.get('/unread-count', authenticate, authorize('ADMIN'), contactController.unreadCount);

// Admin inbox: list, read, mark as read/replied, delete.
router.use(
  createCrudRouter({
    controller: contactController,
    schemas: { update: updateContactSchema, query: contactQuerySchema },
    roles: ['ADMIN'],
  }),
);

export default router;
