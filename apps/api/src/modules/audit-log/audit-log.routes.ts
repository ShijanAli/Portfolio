import { Router } from 'express';
import { authenticate } from '@/common/middlewares/authenticate';
import { authorize } from '@/common/middlewares/authorize';
import { validate } from '@/common/middlewares/validate';
import { auditLogController } from './audit-log.controller';
import { auditLogQuerySchema } from './audit-log.schema';

/** Read-only: the trail is written by the audit middleware and cannot be edited or deleted. */
const router = Router();

router.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate({ query: auditLogQuerySchema }),
  auditLogController.list,
);

export default router;
