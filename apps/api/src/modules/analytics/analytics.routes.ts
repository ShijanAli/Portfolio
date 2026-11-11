import express, { Router } from 'express';
import { authenticate } from '@/common/middlewares/authenticate';
import { authorize } from '@/common/middlewares/authorize';
import { collectLimiter } from '@/common/middlewares/rate-limit';
import { validate } from '@/common/middlewares/validate';
import { analyticsController as controller } from './analytics.controller';
import { breakdownQuerySchema, collectSchema, rangeQuerySchema } from './analytics.schema';

const router = Router();
const admin = [authenticate, authorize('ADMIN')];

// Public: called by the website's tracker. navigator.sendBeacon posts JSON as text/plain.
router.post(
  '/collect',
  collectLimiter,
  express.json({ type: ['application/json', 'text/plain'], limit: '10kb' }),
  validate({ body: collectSchema }),
  controller.collect,
);

// Admin: analytics dashboard.
router.get('/overview', ...admin, validate({ query: rangeQuerySchema }), controller.overview);
router.get('/breakdown', ...admin, validate({ query: breakdownQuerySchema }), controller.breakdown);
router.get('/realtime', ...admin, controller.realtime);
router.get('/ga4', ...admin, validate({ query: rangeQuerySchema }), controller.ga4);

export default router;
