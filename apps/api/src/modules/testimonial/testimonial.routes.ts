import { createCrudRouter } from '@/common/base/create-crud-router';
import { testimonialController } from './testimonial.controller';
import {
  createTestimonialSchema,
  testimonialQuerySchema,
  updateTestimonialSchema,
} from './testimonial.schema';

export default createCrudRouter({
  controller: testimonialController,
  schemas: {
    create: createTestimonialSchema,
    update: updateTestimonialSchema,
    query: testimonialQuerySchema,
  },
  publicRead: true,
});
