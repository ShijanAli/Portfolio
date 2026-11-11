import { Router } from 'express';
import { createCrudRouter } from '@/common/base/create-crud-router';
import { authenticate } from '@/common/middlewares/authenticate';
import { authorize } from '@/common/middlewares/authorize';
import { publicFormLimiter } from '@/common/middlewares/rate-limit';
import { validate } from '@/common/middlewares/validate';
import { idParamSchema } from '@/common/schemas/id.schema';
import { bookingController as controller } from './booking.controller';
import {
  bookingQuerySchema,
  cancelBookingSchema,
  createBookingSchema,
  manageTokenParamSchema,
  rescheduleBookingSchema,
  slotQuerySchema,
  updateBookingSettingSchema,
  updateBookingStatusSchema,
} from './booking.schema';

const router = Router();
const admin = [authenticate, authorize('ADMIN')];
const token = manageTokenParamSchema;

// Public: the booking flow on the website.
router.get('/slots', validate({ query: slotQuerySchema }), controller.slots);
router.post('/', publicFormLimiter, validate({ body: createBookingSchema }), controller.book);

// Public: a client manages their own booking through the secret link in their email.
router.get('/manage/:token', validate({ params: token }), controller.getByToken);
router.post(
  '/manage/:token/cancel',
  publicFormLimiter,
  validate({ params: token, body: cancelBookingSchema }),
  controller.cancelByToken,
);
router.post(
  '/manage/:token/reschedule',
  publicFormLimiter,
  validate({ params: token, body: rescheduleBookingSchema }),
  controller.rescheduleByToken,
);

// Admin
router.get('/settings', ...admin, controller.getSettings);
router.put(
  '/settings',
  ...admin,
  validate({ body: updateBookingSettingSchema }),
  controller.updateSettings,
);
router.patch(
  '/:id/status',
  ...admin,
  validate({ params: idParamSchema, body: updateBookingStatusSchema }),
  controller.updateStatus,
);

// Admin: list, read and delete. Bookings are created and changed only through the flows above.
router.use(
  createCrudRouter({ controller, schemas: { query: bookingQuerySchema }, roles: ['ADMIN'] }),
);

export default router;
