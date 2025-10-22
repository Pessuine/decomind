import type { FastifyRequest } from "fastify";
import type { AppDatabase } from "../config/database";
import { getRiskConfig } from "./config";

export interface RiskResult {
  blocked: boolean;
  reason?: string;
}

export function runRiskChecks(db: AppDatabase, request: FastifyRequest): RiskResult {
  const config = getRiskConfig(db);
  const bodyText = JSON.stringify(request.body ?? "");
  const match = config.keywords.find((keyword) => keyword && bodyText.includes(keyword));
  if (match) {
    return { blocked: true, reason: `keyword:${match}` };
  }
  return { blocked: false };
}
