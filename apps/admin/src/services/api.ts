const ADMIN_BASE = '/admin';

const handleResponse = async <T>(response: Response): Promise<T> => {
  const json = await response.json();
  if (!response.ok) {
    throw new Error((json as { error?: string }).error ?? 'request_failed');
  }
  return json as T;
};

export const login = async (password: string) => {
  const response = await fetch(`${ADMIN_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  return handleResponse<{ token: string }>(response);
};

const withAuth = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
});

export const fetchDashboard = async (token: string) => {
  const response = await fetch(`${ADMIN_BASE}/dashboard`, {
    headers: withAuth(token)
  });
  return handleResponse<{
    requestCount: number;
    aiCallCount: number;
    feedbackCount: number;
    consentCount: number;
  }>(response);
};

export const fetchPrompts = async (token: string) => {
  const response = await fetch(`${ADMIN_BASE}/prompts`, {
    headers: withAuth(token)
  });
  return handleResponse(response);
};

export const savePrompt = async (
  token: string,
  payload: { id?: string; name: string; description: string; content: { system: string; user: string } }
) => {
  const response = await fetch(`${ADMIN_BASE}/prompts`, {
    method: 'POST',
    headers: withAuth(token),
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

export const fetchModelSettings = async (token: string) => {
  const response = await fetch(`${ADMIN_BASE}/model-settings`, {
    headers: withAuth(token)
  });
  return handleResponse(response);
};

export const saveModelSetting = async (
  token: string,
  payload: {
    id?: string;
    name: string;
    baseUrl: string;
    apiKey: string;
    model: string;
    temperature: number;
    isActive: boolean;
  }
) => {
  const response = await fetch(`${ADMIN_BASE}/model-settings`, {
    method: 'POST',
    headers: withAuth(token),
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

export const fetchRequestLogs = async (token: string) => {
  const response = await fetch(`${ADMIN_BASE}/request-logs`, {
    headers: withAuth(token)
  });
  return handleResponse(response);
};

export const fetchAiCalls = async (token: string) => {
  const response = await fetch(`${ADMIN_BASE}/ai-calls`, {
    headers: withAuth(token)
  });
  return handleResponse(response);
};

export const fetchSysConfig = async (token: string) => {
  const response = await fetch(`${ADMIN_BASE}/sys-config`, {
    headers: withAuth(token)
  });
  return handleResponse<Array<{ key: string; value: string }>>(response);
};

export const saveSysConfig = async (
  token: string,
  payload: Array<{ key: string; value: string }>
) => {
  const response = await fetch(`${ADMIN_BASE}/sys-config`, {
    method: 'POST',
    headers: withAuth(token),
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};
