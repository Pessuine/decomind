export type ExecuteMode = 'do' | 'guide';

export interface StepInstruction {
  id: string;
  title: string;
  action: string;
  details?: string;
  status: 'pending' | 'complete' | 'skipped';
}

export interface ExecuteRequestBody {
  sessionId: string;
  task: string;
  context?: string;
  history?: StepInstruction[];
  consentId?: string;
}

export interface ExecuteResponseBody {
  nextStep: StepInstruction;
  summary: string;
}

export type HelpType = 'simpler' | 'alternative' | 'hint' | 'smaller';

export interface HelpRequestBody {
  sessionId: string;
  task: string;
  stepId: string;
  helpType: HelpType;
  context?: string;
  consentId?: string;
}

export interface HelpResponseBody {
  strategy: string;
  recommendation: string;
  confidence: number;
}

export interface SkipRequestBody {
  sessionId: string;
  task: string;
  stepId: string;
  reason?: string;
  consentId?: string;
}

export interface SkipResponseBody {
  replacementStep: StepInstruction;
}

export interface GuideRequestBody {
  task: string;
  context?: string;
  consentId?: string;
}

export interface GuideResponseBody {
  outline: Array<{ title: string; description: string; steps: StepInstruction[] }>;
}

export interface ConsentRequestBody {
  userId: string;
  accepted: boolean;
  metadata?: Record<string, unknown>;
}

export interface ConsentResponseBody {
  consentId: string;
  accepted: boolean;
}

export interface FeedbackRequestBody {
  userId?: string;
  sessionId?: string;
  rating?: number;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface FeedbackResponseBody {
  feedbackId: string;
}

export interface ApiErrorResponse {
  error: string;
  requestId: string;
}
