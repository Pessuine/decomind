export interface RiskConfig {
  keywords: string[];
  maxBodySize: number;
  rateLimit: {
    points: number;
    duration: number;
  };
}

export const defaultRiskConfig: RiskConfig = {
  keywords: ["诈骗", "暴力"],
  maxBodySize: 1024 * 64,
  rateLimit: {
    points: 60,
    duration: 60,
  },
};
