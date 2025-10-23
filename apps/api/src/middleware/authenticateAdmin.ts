import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { appConfig } from '../config/env.js';
import { ApiError } from './errorHandler.js';

export interface AdminTokenPayload {
  role: 'admin';
}

export const authenticateAdmin = (
  req: Request & { user?: AdminTokenPayload },
  _res: Response,
  next: NextFunction
): void => {
  const header = req.headers.authorization ?? '';
  const [, token] = header.split(' ');
  if (!token) {
    throw new ApiError(401, 'unauthorized');
  }
  try {
    const payload = jwt.verify(token, appConfig.jwtSecret) as AdminTokenPayload;
    if (payload.role !== 'admin') {
      throw new ApiError(403, 'forbidden');
    }
    req.user = payload;
    next();
  } catch (error) {
    throw new ApiError(401, 'unauthorized', (error as Error).message);
  }
};
