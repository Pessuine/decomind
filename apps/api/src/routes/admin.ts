import { Router } from 'express';
import {
  login,
  dashboard,
  prompts,
  savePrompt,
  modelSettings,
  saveModelSetting,
  requestLogs,
  aiCalls,
  sysConfig,
  saveSysConfig
} from '../controllers/adminController.js';
import { authenticateAdmin } from '../middleware/authenticateAdmin.js';

const router = Router();

router.post('/login', login);
router.use(authenticateAdmin);
router.get('/dashboard', dashboard);
router.get('/prompts', prompts);
router.post('/prompts', savePrompt);
router.get('/model-settings', modelSettings);
router.post('/model-settings', saveModelSetting);
router.get('/request-logs', requestLogs);
router.get('/ai-calls', aiCalls);
router.get('/sys-config', sysConfig);
router.post('/sys-config', saveSysConfig);

export default router;
