import { createCrudRouter } from '@/common/base/create-crud-router';
import { availabilityController } from './availability.controller';
import {
  availabilityQuerySchema,
  createAvailabilitySchema,
  updateAvailabilitySchema,
} from './availability.schema';

export default createCrudRouter({
  controller: availabilityController,
  schemas: {
    create: createAvailabilitySchema,
    update: updateAvailabilitySchema,
    query: availabilityQuerySchema,
  },
  roles: ['ADMIN'],
});
