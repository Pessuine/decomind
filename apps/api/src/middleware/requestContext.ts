import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

export const requestContext = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = randomUUID();
  res.locals.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};
