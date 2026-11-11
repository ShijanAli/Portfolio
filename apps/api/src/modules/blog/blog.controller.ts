import type { Request, Response } from 'express';
import { createCrudController } from '@/common/base/base.controller';
import { ApiError } from '@/common/utils/api-error';
import { created } from '@/common/utils/api-response';
import { blogService, livePostScope } from './blog.service';

export const blogController = {
  ...createCrudController(blogService, { publicScope: livePostScope }),

  /** The author is always the signed-in user, never a value from the request body. */
  create: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    created(res, await blogService.create({ ...req.body, authorId: req.user.id }));
  },
};
