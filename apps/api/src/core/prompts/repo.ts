import type Database from "better-sqlite3";

export interface PromptRecord {
  name: string;
  version: number;
  content: string;
}

export interface PromptRepo {
  getLatestPrompt(name: string): PromptRecord | null;
}

export function createPromptRepo(db: Database.Database): PromptRepo {
  return {
    getLatestPrompt(name: string) {
      const row = db
        .prepare("SELECT name, version, content FROM prompts WHERE name = ? AND enabled = 1 ORDER BY version DESC LIMIT 1")
        .get(name) as PromptRecord | undefined;
      return row ?? null;
    }
  };
}
