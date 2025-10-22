export const ERROR_CODES = {
  MODEL_TIMEOUT: 'MODEL_TIMEOUT',
  MODEL_FORMAT_ERROR: 'MODEL_FORMAT_ERROR',
  RISK_BLOCKED: 'RISK_BLOCKED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  HOST_FORBIDDEN: 'HOST_FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class ApiError extends Error {
  constructor(public code: ErrorCode, message?: string) {
    super(message ?? code);
  }
}
