import type { Availability } from '@prisma/client';
import { BaseService } from '@/common/base/base.service';
import { prisma } from '@/lib/prisma';
import type { CreateAvailabilityInput, UpdateAvailabilityInput } from './availability.schema';

/** Weekly working hours, in the timezone of the booking settings. */
export const availabilityService = new BaseService<
  Availability,
  CreateAvailabilityInput,
  UpdateAvailabilityInput
>(prisma.availability, {
  resource: 'Availability',
  filterFields: ['dayOfWeek', 'isActive'],
  sortFields: ['dayOfWeek', 'startTime'],
  defaultSort: { field: 'dayOfWeek', order: 'asc' },
});
