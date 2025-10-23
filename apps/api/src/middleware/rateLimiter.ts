import rateLimit from 'express-rate-limit';
import { loadRateLimit } from '../config/env.js';

let cachedLimiter: ReturnType<typeof rateLimit> | null = null;
let lastLoaded = 0;
const CACHE_TTL = 60_000;

export const rateLimiter = async () => {
  const now = Date.now();
  if (!cachedLimiter || now - lastLoaded > CACHE_TTL) {
    const limit = await loadRateLimit();
    cachedLimiter = rateLimit({
      windowMs: 60 * 1000,
      limit,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({ error: 'rate_limited', requestId: res.locals.requestId });
      }
    });
    lastLoaded = now;
  }
  return cachedLimiter;
};
