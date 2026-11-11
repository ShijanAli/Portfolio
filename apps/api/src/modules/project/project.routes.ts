import { createCrudRouter } from '@/common/base/create-crud-router';
import { projectController } from './project.controller';
import { createProjectSchema, projectQuerySchema, updateProjectSchema } from './project.schema';

export default createCrudRouter({
  controller: projectController,
  schemas: { create: createProjectSchema, update: updateProjectSchema, query: projectQuerySchema },
  publicRead: true,
  slugRoute: true,
  viewCounter: true,
});
