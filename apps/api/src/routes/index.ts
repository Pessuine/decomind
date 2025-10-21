import type { FastifyInstance } from 'fastify';
import { registerExecute } from './v1-execute';
import { registerHelp } from './v1-help';
import { registerSkip } from './v1-skip';
import { registerGuide } from './v1-guide';
import { registerFeedback } from './v1-feedback';
import { registerConsent } from './v1-consent';
import { registerHealthz } from './healthz';
import { registerAdminLogin } from './admin-login';

export function buildRoutes(app: FastifyInstance) {
  registerHealthz(app);
  registerExecute(app);
  registerHelp(app);
  registerSkip(app);
  registerGuide(app);
  registerFeedback(app);
  registerConsent(app);
  registerAdminLogin(app);
}
