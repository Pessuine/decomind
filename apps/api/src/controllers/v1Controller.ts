import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  ExecuteRequestBody,
  HelpRequestBody,
  SkipRequestBody,
  GuideRequestBody,
  ConsentRequestBody,
  FeedbackRequestBody
} from 'shared';
import {
  generateNextStep,
  generateHelpStrategy,
  generateGuideOutline
} from '../services/executionService.js';
import { saveConsent, getUserConsent } from '../services/consentService.js';
import { submitFeedback } from '../services/feedbackService.js';

const executeSchema = z.object({
  sessionId: z.string(),
  task: z.string(),
  context: z.string().optional(),
  history: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        action: z.string(),
        details: z.string().optional(),
        status: z.enum(['pending', 'complete', 'skipped'])
      })
    )
    .optional(),
  consentId: z.string().optional()
});

export const executeNextStep = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = executeSchema.parse(req.body) as ExecuteRequestBody;
    const consent = await getUserConsent(payload.sessionId);
    const result = await generateNextStep({
      ...payload,
      consentId: payload.consentId ?? (consent?.accepted ? consent.id : undefined)
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const helpSchema = z.object({
  sessionId: z.string(),
  task: z.string(),
  stepId: z.string(),
  helpType: z.enum(['simpler', 'alternative', 'hint', 'smaller']),
  context: z.string().optional(),
  consentId: z.string().optional()
});

export const requestHelp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = helpSchema.parse(req.body) as HelpRequestBody;
    const consent = await getUserConsent(payload.sessionId);
    const result = await generateHelpStrategy({
      sessionId: payload.sessionId,
      task: payload.task,
      step: payload.stepId,
      helpType: payload.helpType,
      context: payload.context,
      consentId: payload.consentId ?? (consent?.accepted ? consent.id : undefined)
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const skipSchema = z.object({
  sessionId: z.string(),
  task: z.string(),
  stepId: z.string(),
  reason: z.string().optional(),
  consentId: z.string().optional()
});

export const skipStep = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = skipSchema.parse(req.body) as SkipRequestBody;
    const consent = await getUserConsent(payload.sessionId);
    const result = await generateNextStep({
      sessionId: payload.sessionId,
      task: payload.task,
      context: payload.reason,
      history: [],
      consentId: payload.consentId ?? (consent?.accepted ? consent.id : undefined)
    });
    res.json({
      replacementStep: result.nextStep
    });
  } catch (error) {
    next(error);
  }
};

const guideSchema = z.object({
  task: z.string(),
  context: z.string().optional(),
  sessionId: z.string().optional(),
  consentId: z.string().optional()
});

export const generateGuide = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = guideSchema.parse(req.body) as GuideRequestBody & { sessionId?: string };
    const consent = payload.sessionId ? await getUserConsent(payload.sessionId) : null;
    const result = await generateGuideOutline({
      task: payload.task,
      context: payload.context,
      consentId: payload.consentId ?? (consent?.accepted ? consent.id : undefined)
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const consentSchema = z.object({
  userId: z.string(),
  accepted: z.boolean(),
  metadata: z.record(z.unknown()).optional()
});

export const handleConsent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = consentSchema.parse(req.body) as ConsentRequestBody;
    const result = await saveConsent(payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const feedbackSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  message: z.string(),
  metadata: z.record(z.unknown()).optional()
});

export const handleFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = feedbackSchema.parse(req.body) as FeedbackRequestBody;
    const result = await submitFeedback(payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const healthCheck = (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
};
