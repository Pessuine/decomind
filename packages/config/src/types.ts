export interface DecompoConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  adminPasswordHash: string;
  jwtSecret: string;
  consentRetentionDays: number;
  logRetentionDays: number;
  databaseUrl: string;
  allowedHosts: string[];
  enableMockModel: boolean;
  encryptionKey: string;
}
