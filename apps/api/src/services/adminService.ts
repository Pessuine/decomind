import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { appConfig } from '../config/env.js';
import { prisma } from 'database';
import { ApiError } from '../middleware/errorHandler.js';

export const authenticateAdmin = async (password: string) => {
  const match = await bcrypt.compare(password, appConfig.adminPasswordHash);
  if (!match) {
    throw new ApiError(401, 'invalid_credentials');
  }
  const token = jwt.sign({ role: 'admin' }, appConfig.jwtSecret, { expiresIn: '12h' });
  return { token };
};

export const getDashboardStats = async () => {
  const [requestCount, aiCallCount, feedbackCount, consentCount] = await Promise.all([
    prisma.requestLog.count(),
    prisma.aiCall.count(),
    prisma.feedback.count(),
    prisma.consent.count()
  ]);
  return {
    requestCount,
    aiCallCount,
    feedbackCount,
    consentCount
  };
};
