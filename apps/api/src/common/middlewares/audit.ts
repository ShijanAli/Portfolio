import type { RequestHandler } from 'express';
import { API_PREFIX } from '@/config/constants';
import { revalidateWebsite } from '@/lib/revalidate';
import type { AuditAction } from '@/modules/audit-log/audit-log.schema';
import { auditLogService } from '@/modules/audit-log/audit-log.service';

const ACTIONS: Record<string, AuditAction> = {
  POST: 'CREATE',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE',
};

/**
 * Runs after every successful change made by a signed-in user: records who changed what,
 * and tells the website to refresh the pages that show that data. Request bodies are not stored, so passwords and content never end up in the trail.
 */
export const audit: RequestHandler = (req, res, next) => {
  const action = ACTIONS[req.method];
  if (!action) return next();

  res.on('finish', () => {
    // req.user is set by the route's own authentication, which has run by now.
    if (!req.user || res.statusCode >= 400) return;

    const [entity = 'unknown', entityId] = req.originalUrl
      .slice(API_PREFIX.length)
      .split('?')[0]!
      .split('/')
      .filter(Boolean);
    if (entity === 'auth') return;

    // The entity is also the website's cache tag for that data ("projects", "settings"...).
    revalidateWebsite([entity]);

    auditLogService.record({
      userId: req.user.id,
      action,
      entity,
      entityId,
      metadata: { method: req.method, path: req.originalUrl.split('?')[0]! },
    });
  });

  next();
};
