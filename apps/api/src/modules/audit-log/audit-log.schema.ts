import { z } from 'zod';
import { paginationSchema } from '@/common/schemas/pagination.schema';

export const AUDIT_ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN'] as const;

export const auditLogQuerySchema = paginationSchema.extend({
  action: z.enum(AUDIT_ACTIONS).optional(),
  entity: z.string().trim().max(60).optional(),
  userId: z.string().trim().max(64).optional(),
});

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
