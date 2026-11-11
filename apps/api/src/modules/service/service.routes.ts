import { createCrudRouter } from '@/common/base/create-crud-router';
import { serviceController } from './service.controller';
import { createServiceSchema, serviceQuerySchema, updateServiceSchema } from './service.schema';

export default createCrudRouter({
  controller: serviceController,
  schemas: { create: createServiceSchema, update: updateServiceSchema, query: serviceQuerySchema },
  publicRead: true,
  slugRoute: true,
});
