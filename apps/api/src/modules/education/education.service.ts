import type { Education } from '@prisma/client';
import { BaseService } from '@/common/base/base.service';
import { prisma } from '@/lib/prisma';
import type { CreateEducationInput, UpdateEducationInput } from './education.schema';

export const educationService = new BaseService<
  Education,
  CreateEducationInput,
  UpdateEducationInput
>(prisma.education, {
  resource: 'Education',
  searchFields: ['institute', 'degree', 'fieldOfStudy'],
  filterFields: ['isActive'],
  sortFields: ['institute', 'startDate', 'order', 'createdAt'],
  defaultSort: { field: 'startDate', order: 'desc' },
});
