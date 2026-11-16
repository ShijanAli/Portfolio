import express, { Router } from 'express';
import { env } from '@/config/env';
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

// Opening these API addresses in a browser (a mis-pointed email link, or a mail client
// that follows the List-Unsubscribe URL) lands on the website page that asks for a click.
// Only a POST changes anything, so mail scanners that fetch the link cannot (un)subscribe.
for (const page of ['confirm', 'unsubscribe'] as const) {
  router.get(`/${page}`, validate({ query: tokenQuerySchema }), (req, res) => {
    const { token } = req.query as { token?: string };
    res.redirect(302, `${env.WEB_URL}/newsletter/${page}${token ? `?token=${encodeURIComponent(token)}` : ''}`);
  });
}

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
