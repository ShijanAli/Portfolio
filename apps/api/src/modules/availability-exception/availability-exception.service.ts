import type { AvailabilityException } from '@prisma/client';
import { BaseService } from '@/common/base/base.service';
import { prisma } from '@/lib/prisma';
import type {
  CreateAvailabilityExceptionInput,
  UpdateAvailabilityExceptionInput,
} from './availability-exception.schema';

/** Days off and one-off custom hours that override the weekly availability. */
export const availabilityExceptionService = new BaseService<
  AvailabilityException,
  CreateAvailabilityExceptionInput,
  UpdateAvailabilityExceptionInput
>(prisma.availabilityException, {
  resource: 'Availability exception',
  searchFields: ['note'],
  sortFields: ['date'],
  defaultSort: { field: 'date', order: 'asc' },
});
