import { createCrudRouter } from '@/common/base/create-crud-router';
import { blogCategoryController } from './blog-category.controller';
import {
  createBlogCategorySchema,
  blogCategoryQuerySchema,
  updateBlogCategorySchema,
} from './blog-category.schema';

export default createCrudRouter({
  controller: blogCategoryController,
  schemas: {
    create: createBlogCategorySchema,
    update: updateBlogCategorySchema,
    query: blogCategoryQuerySchema,
  },
  publicRead: true,
});
