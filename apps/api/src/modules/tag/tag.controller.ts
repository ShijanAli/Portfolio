import { createCrudController } from '@/common/base/base.controller';
import { tagService } from './tag.service';

export const tagController = createCrudController(tagService);
