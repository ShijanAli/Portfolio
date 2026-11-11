import type { Request, Response } from 'express';
import { isHoneypotFilled } from '@/common/schemas/common.schema';
import { ok } from '@/common/utils/api-response';
import type { SubscribeInput } from './newsletter.schema';
import { newsletterService } from './newsletter.service';

const CHECK_INBOX = 'Almost done. Please check your inbox to confirm your subscription.';

/** The token of a link may be in the JSON body or in the query string. */
function tokenOf(req: Request): string | undefined {
  const candidates = [(req.body as { token?: unknown } | undefined)?.token, req.query.token];
  return candidates.find((value): value is string => typeof value === 'string');
}

export const newsletterController = {
  subscribe: async (req: Request, res: Response) => {
    const body = req.body as SubscribeInput;
    if (!isHoneypotFilled(body)) await newsletterService.subscribe(body);
    ok(res, null, { message: CHECK_INBOX });
  },

  confirm: async (req: Request, res: Response) => {
    await newsletterService.confirm(req.body.token);
    ok(res, null, { message: 'Your subscription is confirmed.' });
  },

  unsubscribe: async (req: Request, res: Response) => {
    await newsletterService.unsubscribe(tokenOf(req));
    ok(res, null, { message: 'You have been unsubscribed.' });
  },

  getPreferences: async (req: Request, res: Response) => {
    ok(res, await newsletterService.getPreferences(tokenOf(req)));
  },

  updatePreferences: async (req: Request, res: Response) => {
    ok(res, await newsletterService.updatePreferences(req.body));
  },
};
