import pino from 'pino';
import { env, isProduction, isTest } from '@/config/env';

export const logger = pino({
  level: isTest ? 'silent' : isProduction ? 'info' : 'debug',
  redact: ['req.headers.authorization', 'req.headers.cookie'],
  transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
});
