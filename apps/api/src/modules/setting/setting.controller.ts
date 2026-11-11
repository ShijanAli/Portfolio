import type { Request, Response } from 'express';
import { ok } from '@/common/utils/api-response';
import type { SettingKey } from './setting.schema';
import { settingService } from './setting.service';

/** Validated against the known keys by the route. */
const keyOf = (req: Request) => req.params.key as SettingKey;

export const settingController = {
  getAll: async (_req: Request, res: Response) => {
    ok(res, await settingService.getAll());
  },

  get: async (req: Request, res: Response) => {
    ok(res, await settingService.get(keyOf(req)));
  },

  update: async (req: Request, res: Response) => {
    ok(res, await settingService.update(keyOf(req), req.body));
  },
};
