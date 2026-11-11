import { createCrudRouter } from '@/common/base/create-crud-router';
import { technologyController } from './technology.controller';
import {
  createTechnologySchema,
  technologyQuerySchema,
  updateTechnologySchema,
} from './technology.schema';

export default createCrudRouter({
  controller: technologyController,
  schemas: {
    create: createTechnologySchema,
    update: updateTechnologySchema,
    query: technologyQuerySchema,
  },
  publicRead: true,
});
