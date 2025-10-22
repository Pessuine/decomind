import { DefaultPrompts, getLatestPrompt } from "../prompts/repo.js";
import type Database from "better-sqlite3";
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

export async function generateActionStep(db: Database.Database, payload: {
  taskTitle: string;
  history: string[];
}): Promise<{ step: { type: "action"; text: string }; progress?: any; menu?: any }> {
  const prompt = getLatestPrompt(db, "action_step") ?? {
    name: "action_step",
    version: 0,
    content: DefaultPrompts.action_step,
  };
  const provider = getProvider();
  const messages = [
    {
      role: "system",
      content: prompt.content,
    },
    {
      role: "user",
      content: JSON.stringify({ task: payload.taskTitle, history: payload.history }),
    },
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
