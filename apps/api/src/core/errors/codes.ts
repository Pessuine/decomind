export const ERROR_MESSAGES = {
  MODEL_TIMEOUT: "加载失败，请重试",
  MODEL_FORMAT_ERROR: "加载失败，请重试",
  RISK_BLOCKED: "请求被拒绝",
  VALIDATION_ERROR: "请求参数校验失败",
  HOST_FORBIDDEN: "非法访问",
  INTERNAL_ERROR: "服务暂时不可用"
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;
