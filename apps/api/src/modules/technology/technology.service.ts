import type { Technology } from '@prisma/client';
import { BaseService } from '@/common/base/base.service';
import { prisma } from '@/lib/prisma';
import type { CreateTechnologyInput, UpdateTechnologyInput } from './technology.schema';

export const technologyService = new BaseService<
  Technology,
  CreateTechnologyInput,
  UpdateTechnologyInput
>(prisma.technology, {
  resource: 'Technology',
  slugFrom: 'name',
  searchFields: ['name'],
  filterFields: ['category', 'isFeatured', 'isActive'],
  sortFields: ['name', 'category', 'order', 'createdAt'],
  defaultSort: { field: 'order', order: 'asc' },
});
