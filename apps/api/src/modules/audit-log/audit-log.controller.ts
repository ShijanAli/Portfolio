import { createCrudController } from '@/common/base/base.controller';
import { auditLogService } from './audit-log.service';

export const auditLogController = createCrudController(auditLogService);
