import { createCrudController } from '@/common/base/base.controller';
import { educationService } from './education.service';

export const educationController = createCrudController(educationService, {
  publicScope: { isActive: true },
});
