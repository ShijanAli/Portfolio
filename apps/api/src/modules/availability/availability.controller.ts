import { createCrudController } from '@/common/base/base.controller';
import { availabilityService } from './availability.service';

export const availabilityController = createCrudController(availabilityService);
