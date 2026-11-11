import express, { Router } from 'express';
import { publicFormLimiter } from '@/common/middlewares/rate-limit';
import { validate } from '@/common/middlewares/validate';
import { newsletterController as controller } from './newsletter.controller';
import {
  subscribeSchema,
  tokenBodySchema,
  tokenQuerySchema,
  updatePreferencesSchema,
} from './newsletter.schema';

/** Public newsletter flows. Everything after subscribing is authorized by a secret token. */
const router = Router();

router.post(
  '/subscribe',
  publicFormLimiter,
  validate({ body: subscribeSchema }),
  controller.subscribe,
);
router.post('/confirm', validate({ body: tokenBodySchema }), controller.confirm);

// Also called directly by mail clients for one-click unsubscribe, which post a form body
// and carry the token in the query string.
router.post(
  '/unsubscribe',
  express.urlencoded({ extended: false }),
  validate({ query: tokenQuerySchema }),
  controller.unsubscribe,
);

router.get('/preferences', validate({ query: tokenQuerySchema }), controller.getPreferences);
router.put(
  '/preferences',
  validate({ body: updatePreferencesSchema }),
  controller.updatePreferences,
);

export default router;
