import { createCrudController } from '@/common/base/base.controller';
import { experienceService } from './experience.service';

export const experienceController = createCrudController(experienceService, {
  publicScope: { isActive: true },
});
