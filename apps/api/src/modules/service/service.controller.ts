import { createCrudController } from '@/common/base/base.controller';
import { PUBLISHED_SCOPE } from '@/common/schemas/common.schema';
import { serviceService } from './service.service';

export const serviceController = createCrudController(serviceService, {
  publicScope: PUBLISHED_SCOPE,
});
