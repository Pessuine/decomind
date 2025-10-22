import type { GuideRequest } from "@decomind/shared-schemas";
import type { AppDatabase } from "../config/database";
import { getPrompt } from "../prompts/repo";
import { PROMPT_NAMES } from "../prompts/names";
import { assertGuideOutline } from "../postrules/validate";

export async function handleGuide(db: AppDatabase, payload: GuideRequest) {
  const prompt = getPrompt(db, PROMPT_NAMES.GUIDE_OUTLINE);
  const parsed = assertGuideOutline(JSON.parse(prompt.content));
  return {
    response: parsed,
    promptVersion: prompt.version
  } as const;
}
