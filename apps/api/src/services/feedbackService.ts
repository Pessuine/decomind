import { createFeedback } from '../repositories/feedbackRepository.js';

export const submitFeedback = async (payload: {
  userId?: string;
  sessionId?: string;
  rating?: number;
  message: string;
  metadata?: Record<string, unknown>;
}) => {
  const feedback = await createFeedback(payload);
  return { feedbackId: feedback.id };
};
