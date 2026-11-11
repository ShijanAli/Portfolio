import { createCrudController } from '@/common/base/base.controller';
import { testimonialService } from './testimonial.service';

export const testimonialController = createCrudController(testimonialService, {
  publicScope: { isActive: true },
});
