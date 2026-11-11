import { Router } from 'express';
import { authenticate } from '@/common/middlewares/authenticate';
import { authorize } from '@/common/middlewares/authorize';
import { validate } from '@/common/middlewares/validate';
import { seoController } from './seo.controller';
import { pageKeyParamSchema, upsertPageSeoSchema } from './seo.schema';

const router = Router();
const pageKey = validate({ params: pageKeyParamSchema });

// Public: read by the website when rendering <head> and sitemap.xml.
router.get('/sitemap', seoController.sitemap);
router.get('/pages/:pageKey', pageKey, seoController.getPage);

// Admin: SEO manager.
router.get('/pages', authenticate, authorize('ADMIN', 'EDITOR'), seoController.listPages);
router.put(
  '/pages/:pageKey',
  authenticate,
  authorize('ADMIN', 'EDITOR'),
  validate({ params: pageKeyParamSchema, body: upsertPageSeoSchema }),
  seoController.upsertPage,
);

export default router;
