import { Prompt } from '@prisma/client';
import {
  findPromptByName,
  listPrompts,
  createPrompt,
  createPromptVersion,
  activatePromptVersion
} from '../repositories/promptRepository.js';
import { ApiError } from '../middleware/errorHandler.js';

export interface PromptTemplate {
  system: string;
  user: string;
}

export interface PromptConfig {
  template: PromptTemplate;
  promptId: string;
  versionId: string;
}

const parsePromptContent = (
  prompt: Prompt & { activeVersion?: { content: string; id: string } | null }
): PromptConfig => {
  if (!prompt.activeVersion) {
    throw new ApiError(500, 'prompt_not_configured');
  }
  try {
    const template = JSON.parse(prompt.activeVersion.content) as PromptTemplate;
    if (!template.system || !template.user) {
      throw new Error('Invalid template');
    }
    return {
      template,
      promptId: prompt.id,
      versionId: prompt.activeVersion.id
    };
  } catch (error) {
    throw new ApiError(500, 'invalid_prompt_template', (error as Error).message);
  }
};

export const getPromptTemplate = async (name: string): Promise<PromptConfig> => {
  const prompt = await findPromptByName(name);
  if (!prompt) {
    throw new ApiError(500, 'prompt_missing');
  }
  return parsePromptContent(prompt);
};

export const getPromptList = async () => {
  return listPrompts();
};

export const createOrUpdatePrompt = async (
  payload: {
    id?: string;
    name: string;
    description: string;
    content: PromptTemplate;
    actor: string;
  }
) => {
  if (payload.id) {
    const version = await createPromptVersion(
      payload.id,
      JSON.stringify(payload.content),
      payload.actor
    );
    await activatePromptVersion(payload.id, version.id);
    return version;
  }
  const created = await createPrompt(
    payload.name,
    payload.description,
    JSON.stringify(payload.content),
    payload.actor
  );
  await activatePromptVersion(created.id, created.versions[0].id);
  return created;
};
