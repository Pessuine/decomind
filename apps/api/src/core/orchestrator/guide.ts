import type { AIProvider } from "../ai/provider-qwen";
import type { PromptRepo, PromptRecord } from "../prompts/repo";
import { validateGuideOutline } from "../postrules/validate";
import type { AIMessage } from "../ai/types";

interface GuideParams {
  topic: string;
  depth?: string;
}

export async function runGuideOutline(provider: AIProvider, prompts: PromptRepo, params: GuideParams) {
  const promptRecord: PromptRecord | null = prompts.getLatestPrompt("guide_outline");
  const prompt =
    promptRecord?.content ??
    `生成任务大纲，输出 JSON {"outline":[{"title":"阶段","steps":["动作"]}]}`;
  const messages: AIMessage[] = [
    { role: "system", content: prompt },
    { role: "user", content: JSON.stringify(params) }
  ];
  const response = await provider.callJson<{ outline: Array<{ title: string }> }>({
    model: "qwen-max",
    messages
  });
  const validated = validateGuideOutline(response.data);
  return {
    payload: validated,
    raw: response,
    promptName: "guide_outline",
    promptVersion: promptRecord?.version ?? 0
  };
}
