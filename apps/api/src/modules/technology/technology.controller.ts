import { createCrudController } from '@/common/base/base.controller';
import { technologyService } from './technology.service';

export const technologyController = createCrudController(technologyService, {
  publicScope: { isActive: true },
});
