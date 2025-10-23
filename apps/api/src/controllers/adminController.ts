import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticateAdmin, getDashboardStats } from '../services/adminService.js';
import { getPromptList, createOrUpdatePrompt, PromptTemplate } from '../services/promptService.js';
import { listModelSettings, updateModelSetting, createModelSetting } from '../repositories/modelSettingRepository.js';
import { listRequestLogs } from '../repositories/requestLogRepository.js';
import { listAiCalls } from '../repositories/aiCallRepository.js';
import { listSysConfigs, updateSysConfig } from '../repositories/sysConfigRepository.js';
import { encrypt } from 'config';
import { appConfig } from '../config/env.js';

const loginSchema = z.object({
  password: z.string().min(6)
});

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await authenticateAdmin(payload.password);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const dashboard = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

export const prompts = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const promptsList = await getPromptList();
    res.json(promptsList);
  } catch (error) {
    next(error);
  }
};

const promptUpsertSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  content: z.object({ system: z.string(), user: z.string() })
});

export const savePrompt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = promptUpsertSchema.parse(req.body) as {
      id?: string;
      name: string;
      description: string;
      content: PromptTemplate;
    };
    const result = await createOrUpdatePrompt({
      ...payload,
      actor: 'admin'
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const modelSettings = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const models = await listModelSettings();
    res.json(models);
  } catch (error) {
    next(error);
  }
};

const modelUpdateSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  baseUrl: z.string().url(),
  apiKey: z.string().min(10),
  model: z.string(),
  temperature: z.number().min(0).max(2),
  isActive: z.boolean()
});

export const saveModelSetting = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = modelUpdateSchema.parse(req.body);
    const encryptedKey = encrypt(payload.apiKey, appConfig.encryptionKey);
    if (payload.id) {
      const result = await updateModelSetting(payload.id, {
        name: payload.name,
        baseUrl: payload.baseUrl,
        apiKeyEncrypted: encryptedKey,
        model: payload.model,
        temperature: payload.temperature,
        isActive: payload.isActive
      });
      res.json(result);
      return;
    }
    const result = await createModelSetting({
      name: payload.name,
      baseUrl: payload.baseUrl,
      apiKeyEncrypted: encryptedKey,
      model: payload.model,
      temperature: payload.temperature,
      isActive: payload.isActive
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const requestLogs = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await listRequestLogs(100);
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

export const aiCalls = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const calls = await listAiCalls(100);
    res.json(calls);
  } catch (error) {
    next(error);
  }
};

const sysConfigSchema = z.array(z.object({ key: z.string(), value: z.string() }));

export const saveSysConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entries = sysConfigSchema.parse(req.body);
    const operations = entries.map((entry) => updateSysConfig(entry.key, entry.value));
    await Promise.all(operations);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const sysConfig = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const configs = await listSysConfigs();
    res.json(configs);
  } catch (error) {
    next(error);
  }
};
