import { createCrudController } from '@/common/base/base.controller';
import { blogCategoryService } from './blog-category.service';

export const blogCategoryController = createCrudController(blogCategoryService);
