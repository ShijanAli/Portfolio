import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { API_PREFIX } from '@/config/constants';
import { env } from '@/config/env';
import { audit } from '@/common/middlewares/audit';
import { errorHandler, notFoundHandler } from '@/common/middlewares/error-handler';
import { globalLimiter } from '@/common/middlewares/rate-limit';
import { logger } from '@/lib/logger';
import { LOCAL_UPLOAD_DIR, LOCAL_UPLOAD_ROUTE, usesCloudinary } from '@/lib/storage';
import routes from './routes';

export function createApp() {
  const app = express();

  // Behind a reverse proxy in production, so req.ip is the real client address.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // The API is called from the website and the admin, which live on other origins.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(
    pinoHttp({ logger, autoLogging: { ignore: (req) => req.url?.endsWith('/health') ?? false } }),
  );
  app.use(globalLimiter);

  // Development only: uploads stored on local disk. In production they live on Cloudinary.
  if (!usesCloudinary) {
    app.use(LOCAL_UPLOAD_ROUTE, express.static(LOCAL_UPLOAD_DIR, { index: false, maxAge: '7d' }));
  }

  app.use(API_PREFIX, audit, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
