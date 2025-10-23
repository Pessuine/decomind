import { prisma } from 'database';

export const findActiveModelSetting = async () => {
  return prisma.modelSetting.findFirst({ where: { isActive: true } });
};

export const listModelSettings = async () => {
  return prisma.modelSetting.findMany({ orderBy: { createdAt: 'desc' } });
};

export const updateModelSetting = async (
  id: string,
  data: Partial<{
    name: string;
    baseUrl: string;
    apiKeyEncrypted: string;
    model: string;
    temperature: number;
    isActive: boolean;
  }>
) => {
  if (data.isActive) {
    await prisma.modelSetting.updateMany({
      data: { isActive: false }
    });
  }
  return prisma.modelSetting.update({
    where: { id },
    data
  });
};

export const createModelSetting = async (
  data: {
    name: string;
    baseUrl: string;
    apiKeyEncrypted: string;
    model: string;
    temperature: number;
    isActive: boolean;
  }
) => {
  if (data.isActive) {
    await prisma.modelSetting.updateMany({ data: { isActive: false } });
  }
  return prisma.modelSetting.create({ data });
};
