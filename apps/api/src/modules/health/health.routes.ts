import { Router } from 'express';
import { ok } from '@/common/utils/api-response';
import { prisma } from '@/lib/prisma';

const router = Router();

router.get('/', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  ok(res, { status: 'ok', uptime: Math.round(process.uptime()) });
});

export default router;
