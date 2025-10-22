import { ConfigRepository, PromptRecord } from "../config/repo";
import { PromptNames } from "./names";

export class PromptRepository {
  constructor(private configRepo: ConfigRepository) {}

  private getPrompt(name: string): PromptRecord | undefined {
    return this.configRepo.getPrompt(name);
  }

  getActionStep() {
    const record = this.getPrompt(PromptNames.ACTION_STEP);
    return record ? { version: record.version, data: JSON.parse(record.content) } : null;
  }

  getHelpPrompt(action: string) {
    let name: string | null = null;
    switch (action) {
      case "simpler":
        name = PromptNames.HELP_SIMPLER;
        break;
      case "alt":
        name = PromptNames.HELP_ALT;
        break;
      case "hint":
        name = PromptNames.HELP_HINT;
        break;
      case "split":
        name = PromptNames.HELP_SPLIT;
        break;
    }
    if (!name) return null;
    const record = this.getPrompt(name);
    return record ? { version: record.version, data: JSON.parse(record.content) } : null;
  }

  getGuideOutline() {
    const record = this.getPrompt(PromptNames.GUIDE_OUTLINE);
    return record ? { version: record.version, data: JSON.parse(record.content) } : null;
  }
}
