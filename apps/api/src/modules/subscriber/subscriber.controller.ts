import type { Request, Response } from 'express';
import { createCrudController } from '@/common/base/base.controller';
import { ok } from '@/common/utils/api-response';
import { subscriberService } from './subscriber.service';

export const subscriberController = {
  ...createCrudController(subscriberService),

  stats: async (_req: Request, res: Response) => {
    ok(res, await subscriberService.getStats());
  },

  exportCsv: async (_req: Request, res: Response) => {
    res
      .type('text/csv')
      .attachment('subscribers.csv')
      .send(await subscriberService.exportCsv());
  },
};
