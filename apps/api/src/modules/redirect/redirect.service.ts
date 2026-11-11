import type { Redirect } from '@prisma/client';
import { BaseService } from '@/common/base/base.service';
import { prisma } from '@/lib/prisma';
import type { CreateRedirectInput, UpdateRedirectInput } from './redirect.schema';

export const redirectService = new BaseService<Redirect, CreateRedirectInput, UpdateRedirectInput>(
  prisma.redirect,
  {
    resource: 'Redirect',
    searchFields: ['fromPath', 'toPath'],
    filterFields: ['isActive'],
    sortFields: ['fromPath', 'hits', 'createdAt'],
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
);
