import { createCrudRouter } from '@/common/base/create-crud-router';
import { experienceController } from './experience.controller';
import {
  createExperienceSchema,
  experienceQuerySchema,
  updateExperienceSchema,
} from './experience.schema';

export default createCrudRouter({
  controller: experienceController,
  schemas: {
    create: createExperienceSchema,
    update: updateExperienceSchema,
    query: experienceQuerySchema,
  },
  publicRead: true,
});
