import { Router } from 'express';
import { authenticate } from '@/common/middlewares/authenticate';
import { authorize } from '@/common/middlewares/authorize';
import { dashboardController } from './dashboard.controller';

const router = Router();

router.get('/', authenticate, authorize('ADMIN', 'EDITOR'), dashboardController.overview);

export default router;
