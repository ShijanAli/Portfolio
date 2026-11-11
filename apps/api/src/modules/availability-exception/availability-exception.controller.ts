import { createCrudController } from '@/common/base/base.controller';
import { availabilityExceptionService } from './availability-exception.service';

export const availabilityExceptionController = createCrudController(availabilityExceptionService);
