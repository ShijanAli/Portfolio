import { createCrudController } from '@/common/base/base.controller';
import { redirectService } from './redirect.service';

export const redirectController = createCrudController(redirectService, {
  publicScope: { isActive: true },
});
