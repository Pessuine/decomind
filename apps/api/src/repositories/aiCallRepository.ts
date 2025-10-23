import { prisma } from 'database';

export const createAiCall = async (data: {
  modelSettingId: string;
  promptVersionId?: string;
  requestPayload: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  success: boolean;
  consentId?: string;
}) => {
  return prisma.aiCall.create({
    data: {
      modelSettingId: data.modelSettingId,
      promptVersionId: data.promptVersionId ?? null,
      requestPayload: data.requestPayload,
      responsePayload: data.responsePayload ?? null,
      success: data.success,
      consentId: data.consentId ?? null
    }
  });
};

export const listAiCalls = async (limit: number) => {
  return prisma.aiCall.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      modelSetting: true,
      promptVersion: true
    }
  });
};
