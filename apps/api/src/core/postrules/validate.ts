import { ensureSingleSentence } from '@decomind/shared-utils';
import { ActionStepSchema, GuideSchema } from './schema.js';

export function validateActionResponse(data: unknown) {
  const parsed = ActionStepSchema.parse(data);
  if (!ensureSingleSentence(parsed.step.text)) {
    throw new Error('INVALID_ACTION_SENTENCE');
  }
  return parsed;
}

export function validateGuideResponse(data: unknown) {
  return GuideSchema.parse(data);
}
