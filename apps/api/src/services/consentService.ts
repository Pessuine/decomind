import { recordConsent, findLatestConsent } from '../repositories/consentRepository.js';

export const saveConsent = async (payload: {
  userId: string;
  accepted: boolean;
  metadata?: Record<string, unknown>;
}) => {
  const consent = await recordConsent(payload);
  return {
    consentId: consent.id,
    accepted: consent.accepted
  };
};

export const getUserConsent = async (userId: string) => {
  const consent = await findLatestConsent(userId);
  return consent ?? null;
};
