import type { AuditLog, Prisma } from '@prisma/client';
import { BaseService } from '@/common/base/base.service';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type { AuditAction } from './audit-log.schema';

export interface AuditEntry {
  userId: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  metadata?: Prisma.InputJsonObject;
}

class AuditLogService extends BaseService<AuditLog, never, never> {
  constructor() {
    super(prisma.auditLog, {
      resource: 'Audit log entry',
      include: { user: { select: { id: true, name: true, email: true } } },
      searchFields: ['entity', 'entityId'],
      filterFields: ['action', 'entity', 'userId'],
      sortFields: ['createdAt'],
      defaultSort: { field: 'createdAt', order: 'desc' },
    });
  }

  /** Never throws: failing to write the trail must not fail the action being recorded. */
  record(entry: AuditEntry): void {
    void prisma.auditLog.create({ data: entry }).catch((error: unknown) => {
      logger.error({ err: error, entry }, 'Could not write audit log');
    });
  }
}

export const auditLogService = new AuditLogService();
