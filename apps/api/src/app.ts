import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import v1Router from './routes/v1.js';
import adminRouter from './routes/admin.js';
import { healthCheck } from './controllers/v1Controller.js';
import { requestContext } from './middleware/requestContext.js';
import { requestLogger } from './middleware/requestLogger.js';
import { hostGuard } from './middleware/hostGuard.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApp = async () => {
  const app = express();
  app.disable('x-powered-by');

  app.use(requestContext);
  app.use(express.json({ limit: '1mb' }));
  app.use(cors({ origin: false }));
  app.use(helmet());
  app.use(async (req, res, next) => {
    const limiter = await rateLimiter();
    limiter(req, res, next);
  });
  app.use(requestLogger);
  app.use(hostGuard);

  app.get('/healthz', healthCheck);
  app.use('/v1', v1Router);
  app.use('/admin', adminRouter);

  const publicDir = path.resolve(__dirname, '../../web/dist');
  const adminDir = path.resolve(__dirname, '../../admin/dist');
  app.use('/app', express.static(publicDir));
  app.use('/console', express.static(adminDir));

  app.use((req, res) => {
    res.status(404).json({ error: 'not_found', requestId: res.locals.requestId });
  });

  app.use(errorHandler);

  return app;
};
