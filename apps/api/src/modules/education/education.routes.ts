import { createCrudRouter } from '@/common/base/create-crud-router';
import { educationController } from './education.controller';
import {
  createEducationSchema,
  educationQuerySchema,
  updateEducationSchema,
} from './education.schema';

export default createCrudRouter({
  controller: educationController,
  schemas: {
    create: createEducationSchema,
    update: updateEducationSchema,
    query: educationQuerySchema,
  },
  publicRead: true,
});
