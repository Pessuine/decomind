import { getConfig } from 'config';
import { prisma } from 'database';

export const appConfig = getConfig();

export const loadAllowedHosts = async (): Promise<string[]> => {
  const record = await prisma.sysConfig.findUnique({ where: { key: 'allowed_hosts' } });
  if (!record) {
    return appConfig.allowedHosts;
  }
  try {
    const parsed = JSON.parse(record.value) as string[];
    return parsed.map((value) => value.toLowerCase());
  } catch (error) {
    throw new Error(`Invalid allowed_hosts configuration: ${(error as Error).message}`);
  }
};

export const loadRateLimit = async (): Promise<number> => {
  const record = await prisma.sysConfig.findUnique({ where: { key: 'rate_limit_per_minute' } });
  if (!record) {
    return 60;
  }
  const parsed = Number(record.value);
  return Number.isFinite(parsed) ? parsed : 60;
};
