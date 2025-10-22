import type { AppDatabase } from "../config/database";
import type { PromptName } from "./names";

interface PromptRecord {
  content: string;
  version: number;
}

const templatePrompts: Record<PromptName, string> = {
  action_step: `{"step":{"type":"action","text":"走到浴室"},"progress":{"current":1,"total":3,"percent":33}}`,
  help_simpler: `{"step":{"type":"action","text":"先准备拖鞋"}}`,
  help_alt: `{"step":{"type":"action","text":"检查浴室是否整洁"}}`,
  help_hint: `{"step":{"type":"action","text":"聚焦下一步动作"}}`,
  help_split: `{"step":{"type":"action","text":"迈向浴室门口"}}`,
  guide_outline: `{"outline":[{"title":"准备","steps":["确认目标"]},{"title":"执行","steps":["分解动作"]}]}`
};

const cache = new Map<PromptName, PromptRecord>();

export function getPrompt(db: AppDatabase, name: PromptName): PromptRecord {
  const cached = cache.get(name);
  if (cached) return cached;
  const row = db
    .prepare<PromptRecord & { enabled: number }>(
      `SELECT content, version, enabled FROM prompts WHERE name = ? ORDER BY version DESC LIMIT 1`
    )
    .get(name);
  if (row && row.enabled) {
    const record = { content: row.content, version: row.version };
    cache.set(name, record);
    return record;
  }
  const fallback = { content: templatePrompts[name], version: 1 };
  cache.set(name, fallback);
  return fallback;
}
