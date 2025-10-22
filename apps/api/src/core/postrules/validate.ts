import { ZodError } from 'zod';
import { ActionStepSchema, GuideResponseSchema, HelpResponseSchema, ActionStep, GuideResponse, HelpResponse } from './schema';

const DISALLOWED_PREFIXES = ['请', '现在', '我们', '首先', '请你', '请您'];

function ensureVerbLike(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Action text must not be empty');
  }
  for (const prefix of DISALLOWED_PREFIXES) {
    if (trimmed.startsWith(prefix)) {
      throw new Error(`Action text must not start with polite prefix: ${prefix}`);
    }
  }
  if (!/^[\p{L}]/u.test(trimmed)) {
    throw new Error('Action text must start with a letter');
  }
}

export function validateActionStep(payload: unknown): ActionStep {
  try {
    const parsed = ActionStepSchema.parse(payload);
    ensureVerbLike(parsed.step.text);
    return parsed;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error('VALIDATION_ERROR:' + error.message);
    }
    throw error;
  }
}

export function validateHelpResponse(payload: unknown): HelpResponse {
  try {
    const parsed = HelpResponseSchema.parse(payload);
    ensureVerbLike(parsed.step.text);
    return parsed;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error('VALIDATION_ERROR:' + error.message);
    }
    throw error;
  }
}

export function validateGuideResponse(payload: unknown): GuideResponse {
  try {
    return GuideResponseSchema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error('VALIDATION_ERROR:' + error.message);
    }
    throw error;
  }
}
