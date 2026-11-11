import type { ProjectCategory } from '@prisma/client';
import { BaseService } from '@/common/base/base.service';
import { prisma } from '@/lib/prisma';
import type {
  CreateProjectCategoryInput,
  UpdateProjectCategoryInput,
} from './project-category.schema';

export const projectCategoryService = new BaseService<
  ProjectCategory,
  CreateProjectCategoryInput,
  UpdateProjectCategoryInput
>(prisma.projectCategory, {
  resource: 'Project category',
  slugFrom: 'name',
  include: { _count: { select: { projects: true } } },
  searchFields: ['name'],
  sortFields: ['name', 'order', 'createdAt'],
  defaultSort: { field: 'order', order: 'asc' },
});
