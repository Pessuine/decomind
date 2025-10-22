export const PROMPT_NAMES = {
  ACTION_STEP: 'action_step',
  HELP_SIMPLER: 'help_simpler',
  HELP_ALT: 'help_alt',
  HELP_HINT: 'help_hint',
  HELP_SPLIT: 'help_split',
  GUIDE_OUTLINE: 'guide_outline'
} as const;

export type PromptName = (typeof PROMPT_NAMES)[keyof typeof PROMPT_NAMES];
