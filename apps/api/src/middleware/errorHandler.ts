import { NextFunction, Request, Response } from 'express';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message?: string) {
    super(message ?? code);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = res.locals.requestId ?? 'unknown';
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({ error: error.code, requestId });
    return;
  }
  res.status(500).json({ error: 'internal_error', requestId });
};
