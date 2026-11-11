import type { Request, Response } from 'express';
import { ok } from '@/common/utils/api-response';
import { dashboardService } from './dashboard.service';

export const dashboardController = {
  overview: async (_req: Request, res: Response) => {
    ok(res, await dashboardService.getOverview());
  },
};
