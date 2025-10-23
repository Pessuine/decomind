import { prisma } from 'database';

export const listRequestLogs = async (limit: number) => {
  return prisma.requestLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit
  });
};
