import { db } from '../database';
import { PromptName } from './names';

type PromptRow = {
  name: string;
  version: number;
  content: string;
  enabled: number;
};

const defaultPrompts: Record<PromptName, string> = {
  action_step:
    'You are a helpful assistant who writes the next atomic action for a human to complete a task. Respond with JSON matching {"step":{"type":"action","text":"<imperative>"}}. Use a single concise verb-led sentence in Chinese.',
  help_simpler:
    'Provide a simpler next action for the task context. Respond with JSON {"step":{"type":"action","text":"..."}} in Chinese.',
  help_alt:
    'Provide an alternative action for the task context. Respond with JSON {"step":{"type":"action","text":"..."}} in Chinese.',
  help_hint:
    'Provide a short hint to help continue the action. Respond with JSON {"step":{"type":"action","text":"..."}} in Chinese.',
  help_split:
    'Split the current action into a smaller atomic action. Respond with JSON {"step":{"type":"action","text":"..."}} in Chinese.',
  guide_outline:
    'Generate an outline for executing the topic. Respond with JSON {"outline":[{"title":"阶段","steps":["步骤"]}]} in Chinese.'
};

export type PromptPayload = {
  name: PromptName;
  version: number;
  content: string;
};

export function getPrompt(name: PromptName): PromptPayload {
  const row = db
    .prepare<PromptRow>('SELECT * FROM prompts WHERE name = ? AND enabled = 1 ORDER BY version DESC LIMIT 1')
    .get(name);
  if (row) {
    return { name: name, version: row.version, content: row.content };
  }
  return { name, version: 1, content: defaultPrompts[name] };
}
