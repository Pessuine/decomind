import { db } from '../config/database.js';

type PromptRecord = {
  name: string;
  version: number;
  content: string;
  enabled: number;
};

const cache = new Map<string, PromptRecord>();

export function getPrompt(name: string): PromptRecord | null {
  if (cache.has(name)) return cache.get(name)!;
  const row = db
    .prepare('SELECT name, version, content, enabled FROM prompts WHERE name = ? AND enabled = 1 ORDER BY version DESC LIMIT 1')
    .get(name) as PromptRecord | undefined;
  if (row) {
    cache.set(name, row);
    return row;
  }
  return null;
}

export function invalidatePrompt(name?: string) {
  if (name) cache.delete(name);
  else cache.clear();
}
