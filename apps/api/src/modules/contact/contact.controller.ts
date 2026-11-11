import type { Request, Response } from 'express';
import { createCrudController } from '@/common/base/base.controller';
import { isHoneypotFilled } from '@/common/schemas/common.schema';
import { created, ok } from '@/common/utils/api-response';
import type { SubmitContactInput } from './contact.schema';
import { contactService } from './contact.service';

const THANK_YOU = 'Thanks for reaching out. I will get back to you soon.';

export const contactController = {
  ...createCrudController(contactService),

  submit: async (req: Request, res: Response) => {
    const body = req.body as SubmitContactInput;
    if (!isHoneypotFilled(body)) await contactService.submit(body);
    created(res, null, THANK_YOU);
  },

  unreadCount: async (_req: Request, res: Response) => {
    ok(res, { count: await contactService.countUnread() });
  },
};
