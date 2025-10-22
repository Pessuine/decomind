import { ErrorCode } from "../errors/codes.js";

export interface RiskCheckInput {
  textFields: string[];
  configKeywords: string[];
  maxBodyLength: number;
}

export function runRiskChecks(input: RiskCheckInput) {
  const { textFields, configKeywords, maxBodyLength } = input;
  for (const text of textFields) {
    if (text.length > maxBodyLength) {
      const err = new Error("Payload too large");
      (err as any).code = ErrorCode.RISK_BLOCKED;
      (err as any).statusCode = 400;
      throw err;
    }
    const lower = text.toLowerCase();
    for (const keyword of configKeywords) {
      if (keyword && lower.includes(keyword.toLowerCase())) {
        const err = new Error("Risk keyword detected");
        (err as any).code = ErrorCode.RISK_BLOCKED;
        (err as any).statusCode = 403;
        throw err;
      }
    }
  }
}
