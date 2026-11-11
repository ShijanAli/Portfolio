import { createCrudController } from '@/common/base/base.controller';
import { PUBLISHED_SCOPE } from '@/common/schemas/common.schema';
import { projectService } from './project.service';

export const projectController = createCrudController(projectService, {
  publicScope: PUBLISHED_SCOPE,
});
