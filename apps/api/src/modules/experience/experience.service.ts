import type { Experience } from '@prisma/client';
import { BaseService } from '@/common/base/base.service';
import { prisma } from '@/lib/prisma';
import type { CreateExperienceInput, UpdateExperienceInput } from './experience.schema';

export const experienceService = new BaseService<
  Experience,
  CreateExperienceInput,
  UpdateExperienceInput
>(prisma.experience, {
  resource: 'Experience',
  searchFields: ['company', 'position'],
  filterFields: ['isCurrent', 'isActive'],
  sortFields: ['company', 'startDate', 'order', 'createdAt'],
  defaultSort: { field: 'startDate', order: 'desc' },
});
