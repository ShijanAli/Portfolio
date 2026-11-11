import { createCrudRouter } from '@/common/base/create-crud-router';
import { blogController } from './blog.controller';
import { createPostSchema, postQuerySchema, updatePostSchema } from './blog.schema';

export default createCrudRouter({
  controller: blogController,
  schemas: { create: createPostSchema, update: updatePostSchema, query: postQuerySchema },
  publicRead: true,
  slugRoute: true,
  viewCounter: true,
});
