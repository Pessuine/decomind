export const ERROR_MESSAGES: Record<string, string> = {
  MODEL_TIMEOUT: '模型调用超时，请稍后重试',
  MODEL_FORMAT_ERROR: '模型返回格式错误',
  RISK_BLOCKED: '请求被风险策略拦截',
  VALIDATION_ERROR: '请求参数不合法',
  HOST_FORBIDDEN: '非法访问',
  INTERNAL_ERROR: '服务器内部错误',
};

export type ErrorCode = keyof typeof ERROR_MESSAGES;
