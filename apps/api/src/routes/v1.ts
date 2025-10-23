import { Router } from 'express';
import {
  executeNextStep,
  requestHelp,
  skipStep,
  generateGuide,
  handleConsent,
  handleFeedback,
  healthCheck
} from '../controllers/v1Controller.js';

const router = Router();

router.post('/execute', executeNextStep);
router.post('/help', requestHelp);
router.post('/skip', skipStep);
router.post('/guide', generateGuide);
router.post('/consent', handleConsent);
router.post('/feedback', handleFeedback);
router.get('/healthz', healthCheck);

export default router;
