import { prisma } from 'database';

export const createFeedback = async (data: {
  userId?: string;
  sessionId?: string;
  rating?: number;
  message: string;
  metadata?: Record<string, unknown>;
}) => {
  return prisma.feedback.create({
    data: {
      userId: data.userId ?? null,
      sessionId: data.sessionId ?? null,
      rating: data.rating ?? null,
      message: data.message,
      metadata: data.metadata ?? null
    }
  });
};
