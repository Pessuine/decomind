import fetch from 'node-fetch';
import { z } from 'zod';
import { appConfig } from '../config/env.js';
import { decrypt } from 'config';
import { findActiveModelSetting } from '../repositories/modelSettingRepository.js';
import { ApiError } from '../middleware/errorHandler.js';
import { createAiCall } from '../repositories/aiCallRepository.js';
import { PromptConfig } from './promptService.js';

interface InvokeOptions<T> {
  prompt: PromptConfig;
  variables: Record<string, string>;
  responseSchema: z.ZodSchema<T>;
  consentId?: string;
  mockPayload?: T;
}

const renderTemplate = (template: string, variables: Record<string, string>): string => {
  return template.replace(/{{(.*?)}}/g, (_, key) => variables[key.trim()] ?? '');
};

const toRequestPayload = (
  prompt: PromptConfig,
  variables: Record<string, string>,
  temperature: number
) => ({
  model: '',
  temperature,
  messages: [
    { role: 'system', content: prompt.template.system },
    { role: 'user', content: renderTemplate(prompt.template.user, variables) }
  ],
  response_format: { type: 'json_object' }
});

const parseModelResponse = (raw: unknown): string => {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Invalid response container');
  }
  const choices = (raw as { choices?: Array<{ message?: { content?: string } }> }).choices;
  if (!choices || choices.length === 0) {
    throw new Error('Empty choices');
  }
  const message = choices[0]?.message;
  if (!message?.content) {
    throw new Error('Missing content');
  }
  const trimmed = message.content.trim();
  if (trimmed.startsWith('```')) {
    const parts = trimmed.split('\n');
    if (parts.length >= 2) {
      parts.shift();
      const lastLine = parts[parts.length - 1];
      if (lastLine.startsWith('```')) {
        parts.pop();
      }
      return parts.join('\n');
    }
  }
  return trimmed;
};

export const invokeModel = async <T>(options: InvokeOptions<T>): Promise<T> => {
  const modelSetting = await findActiveModelSetting();
  if (!modelSetting) {
    throw new ApiError(500, 'model_not_configured');
  }

  if (appConfig.enableMockModel) {
    if (!options.mockPayload) {
      throw new ApiError(500, 'mock_payload_missing');
    }
    const parsed = options.responseSchema.parse(options.mockPayload);
    const serialized = JSON.parse(JSON.stringify(parsed)) as Record<string, unknown>;
    await createAiCall({
      modelSettingId: modelSetting.id,
      promptVersionId: options.prompt.versionId,
      requestPayload: { mock: true, variables: options.variables },
      responsePayload: serialized,
      success: true,
      consentId: options.consentId
    });
    return parsed;
  }

  const apiKey = decrypt(modelSetting.apiKeyEncrypted, appConfig.encryptionKey);
  const payload = toRequestPayload(options.prompt, options.variables, modelSetting.temperature);
  payload.model = modelSetting.model;

  const requestBody = {
    ...payload
  };

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`
  };

  const executeFetch = async () => {
    const response = await fetch(`${modelSetting.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    const json = await response.json();
    if (!response.ok) {
      throw new ApiError(response.status, 'model_error');
    }
    return json;
  };

  const attempt = async () => {
    const json = await executeFetch();
    const content = parseModelResponse(json);
    try {
      return { parsed: options.responseSchema.parse(JSON.parse(content)), raw: json };
    } catch (error) {
      throw new ApiError(502, 'invalid_model_response', (error as Error).message);
    }
  };

  try {
    const result = await attempt();
    await createAiCall({
      modelSettingId: modelSetting.id,
      promptVersionId: options.prompt.versionId,
      requestPayload: requestBody,
      responsePayload: result.raw as Record<string, unknown>,
      success: true,
      consentId: options.consentId
    });
    return result.parsed;
  } catch (error) {
    try {
      const retryResult = await attempt();
      await createAiCall({
        modelSettingId: modelSetting.id,
        promptVersionId: options.prompt.versionId,
        requestPayload: requestBody,
        responsePayload: retryResult.raw as Record<string, unknown>,
        success: true,
        consentId: options.consentId
      });
      return retryResult.parsed;
    } catch (retryError) {
      await createAiCall({
        modelSettingId: modelSetting.id,
        promptVersionId: options.prompt.versionId,
        requestPayload: requestBody,
        success: false,
        consentId: options.consentId
      });
      throw retryError;
    }
  }
};
