import { Request, Response, NextFunction } from 'express';
import pinoHttp from 'pino-http';
import { prisma } from 'database';

const logger = pinoHttp({
  redact: ['req.headers.authorization']
});

export const requestLogger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  logger(req, res);
  const start = Date.now();
  res.on('finish', async () => {
    const duration = Date.now() - start;
    try {
      await prisma.requestLog.create({
        data: {
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode,
          summary: `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`,
          ip: req.ip ?? 'unknown',
          host: req.headers.host ?? 'unknown',
          requestId: res.locals.requestId ?? 'unknown'
        }
      });
    } catch (error) {
      logger.logger.error({ err: error }, 'Failed to persist request log');
    }
  });
  next();
};
