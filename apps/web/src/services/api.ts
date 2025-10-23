import {
  ExecuteRequestBody,
  ExecuteResponseBody,
  HelpRequestBody,
  HelpResponseBody,
  SkipRequestBody,
  SkipResponseBody,
  GuideRequestBody,
  GuideResponseBody,
  ConsentRequestBody,
  ConsentResponseBody,
  FeedbackRequestBody,
  FeedbackResponseBody,
  ApiErrorResponse
} from 'shared';

const API_BASE = '/v1';

const handleResponse = async <T>(response: Response): Promise<T> => {
  const json = await response.json();
  if (!response.ok) {
    const error = json as ApiErrorResponse;
    throw new Error(error.error ?? 'api_error');
  }
  return json as T;
};

export const executeStep = async (payload: ExecuteRequestBody): Promise<ExecuteResponseBody> => {
  const response = await fetch(`${API_BASE}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

export const requestHelp = async (payload: HelpRequestBody): Promise<HelpResponseBody> => {
  const response = await fetch(`${API_BASE}/help`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

export const skipAction = async (payload: SkipRequestBody): Promise<SkipResponseBody> => {
  const response = await fetch(`${API_BASE}/skip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

export const fetchGuide = async (payload: GuideRequestBody): Promise<GuideResponseBody> => {
  const response = await fetch(`${API_BASE}/guide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

export const sendConsent = async (payload: ConsentRequestBody): Promise<ConsentResponseBody> => {
  const response = await fetch(`${API_BASE}/consent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

export const sendFeedback = async (payload: FeedbackRequestBody): Promise<FeedbackResponseBody> => {
  const response = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};
