import type { AIProvider } from "../ai/provider-qwen";
import type { PromptRepo, PromptRecord } from "../prompts/repo";
import { validateHelpStep } from "../postrules/validate";
import type { AIMessage } from "../ai/types";

interface HelpParams {
  action: "simpler" | "alt" | "hint" | "split";
  context: { current: string; task: string };
}

export async function runHelpStep(provider: AIProvider, prompts: PromptRepo, params: HelpParams) {
  const promptName = `help_${params.action}`;
  const promptRecord: PromptRecord | null = prompts.getLatestPrompt(promptName);
  const prompt =
    promptRecord?.content ??
    `你提供${params.action}建议。输出 JSON {"step":{"type":"action","text":"..."}}，动词开头。`;
  const messages: AIMessage[] = [
    { role: "system", content: prompt },
    { role: "user", content: JSON.stringify(params.context) }
  ];
  const response = await provider.callJson<{ step: { type: string; text: string } }>({
    model: "qwen-max",
    messages
  });
  const validated = validateHelpStep(response.data);
  return {
    payload: validated,
    raw: response,
    promptName,
    promptVersion: promptRecord?.version ?? 0
  };
}
