import { createCrudController } from '@/common/base/base.controller';
import { projectCategoryService } from './project-category.service';

export const projectCategoryController = createCrudController(projectCategoryService);
