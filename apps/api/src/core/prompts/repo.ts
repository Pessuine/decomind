import type Database from "better-sqlite3";

export interface PromptRecord {
  name: string;
  version: number;
  content: string;
}

export function getLatestPrompt(db: Database.Database, name: string): PromptRecord | null {
  const row = db
    .prepare(`SELECT name, version, content FROM prompts WHERE name = ? AND enabled = 1 ORDER BY version DESC LIMIT 1`)
    .get(name);
  if (!row) {
    return null;
  }
  return {
    name: row.name,
    version: row.version,
    content: row.content,
  };
}

export const DefaultPrompts: Record<string, string> = {
  action_step: `You are an assistant that outputs a single JSON object describing a small atomic action for the user task. Output format: {"step":{"type":"action","text":"动词开头的一句话"},"progress":{"current":number,"total":number,"percent":number},"menu":[{"key":"simpler","label":"更简单一点"},{"key":"alt","label":"换个做法"},{"key":"hint","label":"给个快速提示"},{"key":"split","label":"分更小一步"}]}. The text must be a short imperative sentence in Chinese without polite prefixes.`,
  help_simpler: `Return JSON {"step":{"type":"action","text":"..."}} with a simpler action.`,
  help_alt: `Return JSON {"step":{"type":"action","text":"..."}} with an alternative action.`,
  help_hint: `Return JSON {"step":{"type":"action","text":"..."}} containing a quick hint.`,
  help_split: `Return JSON {"step":{"type":"action","text":"..."}} with a smaller step.`,
  guide_outline: `Return JSON {"outline":[{"title":"阶段","steps":["步骤"]}]}.`,
};
