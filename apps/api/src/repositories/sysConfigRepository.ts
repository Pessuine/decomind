import { prisma } from 'database';

export const listSysConfigs = async () => {
  return prisma.sysConfig.findMany();
};

export const updateSysConfig = async (key: string, value: string) => {
  return prisma.sysConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
};
