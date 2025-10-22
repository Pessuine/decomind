import type { ExecuteRequest, HelpRequest, SkipRequest } from "@decomind/shared-schemas";
import type { AppDatabase } from "../config/database";
import { getPrompt } from "../prompts/repo";
import { PROMPT_NAMES } from "../prompts/names";
import { assertActionStep } from "../postrules/validate";

function buildProgress(historyCount: number, total = historyCount + 4) {
  const current = historyCount + 1;
  const percent = Math.min(100, Math.round((current / total) * 100));
  return { current, total, percent };
}

export async function handleExecute(db: AppDatabase, payload: ExecuteRequest) {
  const prompt = getPrompt(db, PROMPT_NAMES.ACTION_STEP);
  const parsed = assertActionStep(JSON.parse(prompt.content));
  const historyCount = payload.task.history.length;
  const progress = parsed.progress ?? buildProgress(historyCount);
  const stepText = parsed.step.text.startsWith("执行")
    ? parsed.step.text
    : `执行第${historyCount + 1}步：${payload.task.title}`;
  return {
    response: {
      step: { type: "action", text: stepText },
      progress,
      menu: parsed.menu ?? [
        { key: "simpler", label: "更简单一点" },
        { key: "alt", label: "换个做法" },
        { key: "hint", label: "给个快速提示" },
        { key: "split", label: "分更小一步" }
      ]
    },
    promptVersion: prompt.version
  } as const;
}

export async function handleHelp(db: AppDatabase, payload: HelpRequest) {
  const map = {
    simpler: PROMPT_NAMES.HELP_SIMPLER,
    alt: PROMPT_NAMES.HELP_ALT,
    hint: PROMPT_NAMES.HELP_HINT,
    split: PROMPT_NAMES.HELP_SPLIT
  } as const;
  const prompt = getPrompt(db, map[payload.action]);
  const parsed = assertActionStep(JSON.parse(prompt.content));
  return {
    response: parsed,
    promptVersion: prompt.version
  } as const;
}

export async function handleSkip(db: AppDatabase, payload: SkipRequest) {
  const prompt = getPrompt(db, PROMPT_NAMES.HELP_ALT);
  const parsed = assertActionStep(JSON.parse(prompt.content));
  return {
    response: parsed,
    promptVersion: prompt.version
  } as const;
}
