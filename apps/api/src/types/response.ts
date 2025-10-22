export type ApiStatus = "ok" | "error";

export interface ApiMeta {
  request_id: string;
  latency_ms: number;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  version: 1;
  status: ApiStatus;
  meta: ApiMeta;
  data: T;
  error: ApiError | null;
}

export function createSuccessResponse<T>(requestId: string, latencyMs: number, data: T): ApiResponse<T> {
  return {
    version: 1,
    status: "ok",
    meta: { request_id: requestId, latency_ms: latencyMs },
    data,
    error: null
  };
}

export function createErrorResponse(requestId: string, latencyMs: number, error: ApiError): ApiResponse<Record<string, never>> {
  return {
    version: 1,
    status: "error",
    meta: { request_id: requestId, latency_ms: latencyMs },
    data: {} as Record<string, never>,
    error
  };
}
