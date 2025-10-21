import { ActionResponse } from '@decomind/shared-schemas';

const FORBIDDEN_PREFIX = ['请', '现在', '我们', '首先'];

export function validateActionStep(step: ActionResponse['step']): string[] {
  const errors: string[] = [];
  if (!/^\p{Letter}/u.test(step.text)) {
    errors.push('Step must start with a letter.');
  }
  for (const prefix of FORBIDDEN_PREFIX) {
    if (step.text.startsWith(prefix)) {
      errors.push(`Step must not start with ${prefix}`);
    }
  }
  if (step.text.includes('。') && step.text.split('。').length > 2) {
    errors.push('Step must be a single concise sentence.');
  }
  return errors;
}
