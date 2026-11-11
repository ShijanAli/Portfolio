import { createCrudRouter } from '@/common/base/create-crud-router';
import { projectCategoryController } from './project-category.controller';
import {
  createProjectCategorySchema,
  projectCategoryQuerySchema,
  updateProjectCategorySchema,
} from './project-category.schema';

export default createCrudRouter({
  controller: projectCategoryController,
  schemas: {
    create: createProjectCategorySchema,
    update: updateProjectCategorySchema,
    query: projectCategoryQuerySchema,
  },
  publicRead: true,
});
