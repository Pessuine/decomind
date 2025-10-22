import type Database from "better-sqlite3";
import { DefaultPrompts, getLatestPrompt } from "../prompts/repo.js";
import { QwenProvider } from "../ai/provider-qwen.js";
import { ErrorCode } from "../errors/codes.js";

const providerSingleton = { instance: null as QwenProvider | null };

function getProvider(): QwenProvider {
  if (!providerSingleton.instance) {
    providerSingleton.instance = new QwenProvider();
  }
  return providerSingleton.instance;
}

export async function generateGuideOutline(db: Database.Database, payload: { topic: string; depth: string }) {
  const prompt = getLatestPrompt(db, "guide_outline") ?? {
    name: "guide_outline",
    version: 0,
    content: DefaultPrompts.guide_outline,
  };
  const provider = getProvider();
  const messages = [
    { role: "system", content: prompt.content },
    { role: "user", content: JSON.stringify(payload) },
  ];
  const result = await provider.callJson({
    model: process.env.MODEL_NAME || "qwen-max",
    messages,
  });
  if (!result || typeof result !== "object" || !("outline" in result)) {
    const err = new Error("Invalid model response");
    (err as any).code = ErrorCode.MODEL_FORMAT_ERROR;
    (err as any).statusCode = 502;
    throw err;
  }
  return result as any;
}
