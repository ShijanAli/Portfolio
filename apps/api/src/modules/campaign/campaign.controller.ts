import type { Request, Response } from 'express';
import { createCrudController } from '@/common/base/base.controller';
import { ok } from '@/common/utils/api-response';
import { campaignService } from './campaign.service';

const idOf = (req: Request) => String(req.params.id);

export const campaignController = {
  ...createCrudController(campaignService),

  stats: async (req: Request, res: Response) => {
    ok(res, await campaignService.getStats(idOf(req)));
  },

  sendTest: async (req: Request, res: Response) => {
    await campaignService.sendTest(idOf(req), req.body.email);
    ok(res, null, { message: 'Test email sent' });
  },

  send: async (req: Request, res: Response) => {
    ok(res, await campaignService.send(idOf(req)), { message: 'Campaign is being sent' });
  },
};
