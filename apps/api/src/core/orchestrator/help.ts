import type Database from "better-sqlite3";
import { DefaultPrompts, getLatestPrompt } from "../prompts/repo.js";
import { QwenProvider } from "../ai/provider-qwen.js";
import { ErrorCode } from "../errors/codes.js";

const providerSingleton = {
  instance: null as QwenProvider | null,
};

function getProvider(): QwenProvider {
  if (!providerSingleton.instance) {
    providerSingleton.instance = new QwenProvider();
  }
  return providerSingleton.instance;
}

const KEY_TO_PROMPT: Record<string, string> = {
  simpler: "help_simpler",
  alt: "help_alt",
  hint: "help_hint",
  split: "help_split",
};

export async function generateHelpStep(
  db: Database.Database,
  payload: { action: keyof typeof KEY_TO_PROMPT; context: Record<string, string> }
) {
  const promptName = KEY_TO_PROMPT[payload.action];
  const prompt = getLatestPrompt(db, promptName) ?? {
    name: promptName,
    version: 0,
    content: DefaultPrompts[promptName as keyof typeof DefaultPrompts],
  };
  const provider = getProvider();
  const messages = [
    { role: "system", content: prompt.content },
    { role: "user", content: JSON.stringify(payload.context) },
  ];
  const result = await provider.callJson({
    model: process.env.MODEL_NAME || "qwen-max",
    messages,
  });
  if (!result || typeof result !== "object" || !("step" in result)) {
    const err = new Error("Invalid model response");
    (err as any).code = ErrorCode.MODEL_FORMAT_ERROR;
    (err as any).statusCode = 502;
    throw err;
  }
  return result as any;
}
