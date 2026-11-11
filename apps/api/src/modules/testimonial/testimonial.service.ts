import type { Testimonial } from '@prisma/client';
import { BaseService } from '@/common/base/base.service';
import { prisma } from '@/lib/prisma';
import type { CreateTestimonialInput, UpdateTestimonialInput } from './testimonial.schema';

export const testimonialService = new BaseService<
  Testimonial,
  CreateTestimonialInput,
  UpdateTestimonialInput
>(prisma.testimonial, {
  resource: 'Testimonial',
  searchFields: ['name', 'company', 'message'],
  filterFields: ['isFeatured', 'isActive'],
  sortFields: ['name', 'rating', 'order', 'createdAt'],
  defaultSort: { field: 'order', order: 'asc' },
});
