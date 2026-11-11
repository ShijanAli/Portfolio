import { Router } from 'express';
import { authenticate } from '@/common/middlewares/authenticate';
import { authLimiter, refreshLimiter } from '@/common/middlewares/rate-limit';
import { validate } from '@/common/middlewares/validate';
import { authController } from './auth.controller';
import { changePasswordSchema, loginSchema } from './auth.schema';

const router = Router();

router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authController.logout);

router.get('/me', authenticate, authController.me);
router.patch(
  '/change-password',
  authenticate,
  authLimiter,
  validate({ body: changePasswordSchema }),
  authController.changePassword,
);

export default router;
