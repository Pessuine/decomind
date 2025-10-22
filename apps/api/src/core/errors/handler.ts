import { FastifyReply } from 'fastify';
import { ApiError, ERROR_CODES } from './codes';

type ResponseShape = {
  version: 1;
  status: 'error';
  error: {
    code: string;
    message: string;
  };
};

export function buildErrorResponse(error: unknown): ResponseShape {
  if (error instanceof ApiError) {
    return {
      version: 1,
      status: 'error',
      error: {
        code: error.code,
        message: error.message ?? '加载失败，请重试'
      }
    };
  }

  const message = error instanceof Error ? error.message : 'INTERNAL_ERROR';
  const code = determineCodeFromMessage(message);
  return {
    version: 1,
    status: 'error',
    error: {
      code,
      message: mapDefaultMessage(code)
    }
  };
}

export function sendError(reply: FastifyReply, error: unknown) {
  const response = buildErrorResponse(error);
  const statusCode = response.error.code === ERROR_CODES.HOST_FORBIDDEN ? 403 : 500;
  reply.status(statusCode).send(response);
}

function determineCodeFromMessage(message: string): string {
  if (message.startsWith('MODEL_FORMAT_ERROR')) {
    return ERROR_CODES.MODEL_FORMAT_ERROR;
  }
  if (message.startsWith('VALIDATION_ERROR')) {
    return ERROR_CODES.VALIDATION_ERROR;
  }
  if (message.startsWith('RISK_BLOCKED')) {
    return ERROR_CODES.RISK_BLOCKED;
  }
  return ERROR_CODES.INTERNAL_ERROR;
}

function mapDefaultMessage(code: string): string {
  switch (code) {
    case ERROR_CODES.MODEL_TIMEOUT:
      return '加载失败，请重试';
    case ERROR_CODES.MODEL_FORMAT_ERROR:
      return '模型响应无法解析';
    case ERROR_CODES.RISK_BLOCKED:
      return '请求被拒绝';
    case ERROR_CODES.VALIDATION_ERROR:
      return '请求参数校验失败';
    case ERROR_CODES.HOST_FORBIDDEN:
      return '非法访问';
    default:
      return '加载失败，请重试';
  }
}
