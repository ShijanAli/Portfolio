import { createCrudRouter } from '@/common/base/create-crud-router';
import { availabilityExceptionController } from './availability-exception.controller';
import {
  availabilityExceptionQuerySchema,
  createAvailabilityExceptionSchema,
  updateAvailabilityExceptionSchema,
} from './availability-exception.schema';

export default createCrudRouter({
  controller: availabilityExceptionController,
  schemas: {
    create: createAvailabilityExceptionSchema,
    update: updateAvailabilityExceptionSchema,
    query: availabilityExceptionQuerySchema,
  },
  roles: ['ADMIN'],
});
