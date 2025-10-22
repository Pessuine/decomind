export interface RiskConfig {
  keywords: string[];
  maxTaskLength: number;
}

export const defaultRiskConfig: RiskConfig = {
  keywords: ["炸弹", "违禁"],
  maxTaskLength: 200
};
