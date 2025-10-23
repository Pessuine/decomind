import { prisma } from 'database';

export const recordConsent = async (data: {
  userId: string;
  accepted: boolean;
  metadata?: Record<string, unknown>;
}) => {
  return prisma.consent.create({
    data: {
      userId: data.userId,
      accepted: data.accepted,
      metadata: data.metadata ?? null
    }
  });
};

export const findLatestConsent = async (userId: string) => {
  return prisma.consent.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
};
