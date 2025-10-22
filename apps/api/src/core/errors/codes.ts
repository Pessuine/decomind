export enum ErrorCode {
  MODEL_TIMEOUT = "MODEL_TIMEOUT",
  MODEL_FORMAT_ERROR = "MODEL_FORMAT_ERROR",
  RISK_BLOCKED = "RISK_BLOCKED",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  HOST_FORBIDDEN = "HOST_FORBIDDEN",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.MODEL_TIMEOUT]: "加载失败，请重试",
  [ErrorCode.MODEL_FORMAT_ERROR]: "模型返回格式错误",
  [ErrorCode.RISK_BLOCKED]: "请求被拒绝",
  [ErrorCode.VALIDATION_ERROR]: "请求参数校验失败",
  [ErrorCode.HOST_FORBIDDEN]: "非法访问",
  [ErrorCode.INTERNAL_ERROR]: "加载失败，请重试",
};
