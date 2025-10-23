import { Request, Response, NextFunction } from 'express';
import { loadAllowedHosts } from '../config/env.js';

let cachedHosts: string[] | null = null;
let lastLoaded = 0;
const CACHE_TTL = 60_000;

export const hostGuard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = Date.now();
    if (!cachedHosts || now - lastLoaded > CACHE_TTL) {
      cachedHosts = await loadAllowedHosts();
      lastLoaded = now;
    }
    const hostHeader = (req.headers.host ?? '').split(':')[0].toLowerCase();
    if (!cachedHosts.includes(hostHeader)) {
      res.status(403).json({
        error: 'forbidden_host',
        requestId: res.locals.requestId
      });
      return;
    }
    next();
  } catch (error) {
    res.status(500).json({
      error: 'host_guard_error',
      requestId: res.locals.requestId
    });
  }
};
