import { z } from 'zod';
import {
  booleanQuerySchema,
  emailSchema,
  honeypotSchema,
  optionalText,
} from '@/common/schemas/common.schema';
import { paginationSchema } from '@/common/schemas/pagination.schema';

export const submitContactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  email: emailSchema,
  subject: optionalText(150),
  message: z.string().trim().min(10, 'Please write at least 10 characters').max(5000),
  website: honeypotSchema,
});

export const updateContactSchema = z.object({
  isRead: z.boolean().optional(),
  /** `true` stamps the reply time, `false` clears it. */
  replied: z.boolean().optional(),
});

export const contactQuerySchema = paginationSchema.extend({
  isRead: booleanQuerySchema.optional(),
});

export type SubmitContactInput = z.infer<typeof submitContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
