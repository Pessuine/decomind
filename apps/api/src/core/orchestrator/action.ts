import type { AIProvider } from "../ai/provider-qwen";
import type { PromptRepo, PromptRecord } from "../prompts/repo";
import { validateActionStep } from "../postrules/validate";
import type { AIMessage } from "../ai/types";

interface ExecuteParams {
  task: { title: string; history: string[] };
  prefs: Record<string, string | undefined>;
  consentImprove: boolean;
}

export async function runActionStep(
  provider: AIProvider,
  prompts: PromptRepo,
  params: ExecuteParams
) {
  const promptRecord: PromptRecord | null = prompts.getLatestPrompt("action_step");
  const prompt =
    promptRecord?.content ??
    `你是一位任务分解助手。给出下一步原子动作，动词开头，禁止寒暄。输出 JSON: {"step":{"type":"action","text":"..."},"progress":{"current":1,"total":5,"percent":20},"menu":[{"key":"simpler","label":"更简单一点"}]}`;
  const messages: AIMessage[] = [
    { role: "system", content: prompt },
    {
      role: "user",
      content: JSON.stringify({
        task: params.task,
        prefs: params.prefs
      })
    }
  ];
  const response = await provider.callJson<{ step: { type: string; text: string } }>({
    model: "qwen-max",
    messages
  });
  const validated = validateActionStep(response.data);
  return {
    payload: validated,
    raw: response,
    promptName: "action_step",
    promptVersion: promptRecord?.version ?? 0
  };
}
