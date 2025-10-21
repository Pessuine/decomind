import NodeCache from 'node-cache';
import { db } from '../../db';

interface PromptRow {
  id: number;
  name: string;
  version: number;
  content: string;
  enabled: number;
}

const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

export function getPrompt(name: string): { content: string; version: number } {
  const cached = cache.get<{ content: string; version: number }>(name);
  if (cached) return cached;
  const row = db
    .prepare('SELECT name, version, content FROM prompts WHERE name = ? AND enabled = 1 ORDER BY version DESC LIMIT 1')
    .get(name) as PromptRow | undefined;
  if (!row) {
    throw new Error(`Prompt ${name} not found`);
  }
  const prompt = { content: row.content, version: row.version };
  cache.set(name, prompt);
  return prompt;
}

export function invalidatePrompt(name?: string) {
  if (name) cache.del(name);
  else cache.flushAll();
}
