import type { Tag } from '@prisma/client';
import { BaseService } from '@/common/base/base.service';
import { prisma } from '@/lib/prisma';
import type { CreateTagInput, UpdateTagInput } from './tag.schema';

export const tagService = new BaseService<Tag, CreateTagInput, UpdateTagInput>(prisma.tag, {
  resource: 'Tag',
  slugFrom: 'name',
  include: { _count: { select: { posts: true } } },
  searchFields: ['name'],
  sortFields: ['name', 'createdAt'],
  defaultSort: { field: 'name', order: 'asc' },
});
