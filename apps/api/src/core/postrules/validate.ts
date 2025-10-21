import { ActionResponse } from '@decomind/shared-schemas';
import { validateActionStep } from './schema';
import { ApiError } from '../errors/handler';

export function ensureActionResponseCompliance(response: ActionResponse) {
  const errors = validateActionStep(response.step);
  if (errors.length) {
    throw new ApiError('MODEL_FORMAT_ERROR', errors.join('; '));
  }
}
