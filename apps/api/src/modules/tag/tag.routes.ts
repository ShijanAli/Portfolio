import { createCrudRouter } from '@/common/base/create-crud-router';
import { tagController } from './tag.controller';
import { createTagSchema, tagQuerySchema, updateTagSchema } from './tag.schema';

export default createCrudRouter({
  controller: tagController,
  schemas: { create: createTagSchema, update: updateTagSchema, query: tagQuerySchema },
  publicRead: true,
});
