import { z } from 'zod';
import { StepInstruction } from 'shared';
import { getPromptTemplate } from './promptService.js';
import { invokeModel } from './modelService.js';

const stepSchema = z.object({
  id: z.string(),
  title: z.string(),
  action: z.string(),
  details: z.string().optional(),
  status: z.enum(['pending', 'complete', 'skipped']).default('pending')
});

const executeResponseSchema = z.object({
  nextStep: stepSchema,
  summary: z.string()
});

export const generateNextStep = async (payload: {
  sessionId: string;
  task: string;
  context?: string;
  history?: StepInstruction[];
  consentId?: string;
}) => {
  const prompt = await getPromptTemplate('execute_step');
  const history = JSON.stringify(payload.history ?? []);
  return invokeModel({
    prompt,
    variables: {
      task: payload.task,
      context: payload.context ?? '',
      history
    },
    responseSchema: executeResponseSchema,
    consentId: payload.consentId,
    mockPayload: {
      nextStep: {
        id: 'mock-step',
        title: '确认目标',
        action: '确认目标关键点',
        details: '快速确认任务核心信息。',
        status: 'pending'
      },
      summary: '已提供下一步行动'
    }
  });
};

const helpResponseSchema = z.object({
  strategy: z.string(),
  recommendation: z.string(),
  confidence: z.number()
});

export const generateHelpStrategy = async (payload: {
  sessionId: string;
  task: string;
  step: string;
  helpType: string;
  context?: string;
  consentId?: string;
}) => {
  const prompt = await getPromptTemplate('help_strategy');
  return invokeModel({
    prompt,
    variables: {
      task: payload.task,
      step: payload.step,
      helpType: payload.helpType,
      context: payload.context ?? ''
    },
    responseSchema: helpResponseSchema,
    consentId: payload.consentId,
    mockPayload: {
      strategy: '分解步骤',
      recommendation: '将动作拆得更小，并聚焦首个动作。',
      confidence: 0.8
    }
  });
};

const guideStepSchema = z.object({
  title: z.string(),
  description: z.string(),
  steps: z.array(stepSchema)
});

const guideResponseSchema = z.object({
  outline: z.array(guideStepSchema)
});

export const generateGuideOutline = async (payload: { task: string; context?: string; consentId?: string }) => {
  const prompt = await getPromptTemplate('guide_outline');
  return invokeModel({
    prompt,
    variables: {
      task: payload.task,
      context: payload.context ?? ''
    },
    responseSchema: guideResponseSchema,
    consentId: payload.consentId,
    mockPayload: {
      outline: [
        {
          title: '准备阶段',
          description: '确认需求与目标。',
          steps: [
            {
              id: 'guide-mock-1',
              title: '梳理需求',
              action: '列出主要需求',
              status: 'pending'
            }
          ]
        }
      ]
    }
  });
};
