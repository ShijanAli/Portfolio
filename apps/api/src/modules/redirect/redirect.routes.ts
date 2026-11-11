import { createCrudRouter } from '@/common/base/create-crud-router';
import { redirectController } from './redirect.controller';
import { createRedirectSchema, redirectQuerySchema, updateRedirectSchema } from './redirect.schema';

// Reads are public so the website can load the active redirects.
export default createCrudRouter({
  controller: redirectController,
  schemas: {
    create: createRedirectSchema,
    update: updateRedirectSchema,
    query: redirectQuerySchema,
  },
  publicRead: true,
  roles: ['ADMIN'],
});
