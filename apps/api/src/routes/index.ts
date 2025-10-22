import type { FastifyInstance } from "fastify";
import { registerExecuteRoute } from "./v1-execute";
import { registerHelpRoute } from "./v1-help";
import { registerSkipRoute } from "./v1-skip";
import { registerGuideRoute } from "./v1-guide";
import { registerFeedbackRoute } from "./v1-feedback";
import { registerConsentRoute } from "./v1-consent";
import { registerHealthRoute } from "./healthz";

export function registerRoutes(app: FastifyInstance) {
  registerExecuteRoute(app);
  registerHelpRoute(app);
  registerSkipRoute(app);
  registerGuideRoute(app);
  registerFeedbackRoute(app);
  registerConsentRoute(app);
  registerHealthRoute(app);
}
