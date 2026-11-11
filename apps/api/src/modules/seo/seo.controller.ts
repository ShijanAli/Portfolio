import type { Request, Response } from 'express';
import { ok } from '@/common/utils/api-response';
import type { PageKey } from './seo.schema';
import { seoService } from './seo.service';

/** Validated against PAGE_KEYS by the route. */
const pageKeyOf = (req: Request) => req.params.pageKey as PageKey;

export const seoController = {
  listPages: async (_req: Request, res: Response) => {
    ok(res, await seoService.listPages());
  },

  getPage: async (req: Request, res: Response) => {
    ok(res, await seoService.getPage(pageKeyOf(req)));
  },

  upsertPage: async (req: Request, res: Response) => {
    ok(res, await seoService.upsertPage(pageKeyOf(req), req.body));
  },

  sitemap: async (_req: Request, res: Response) => {
    ok(res, await seoService.getSitemap());
  },
};
