/**
 * FunBet Casino — Rate Limiter
 *
 * Tiered rate limiting using in-memory store with sliding window:
 * - AUTH: 5 requests / 15 min (brute-force protection)
 * - API: 100 requests / 1 min (general)
 * - FINANCIAL: 10 requests / 1 min / user (wallet operations)
 * - GAME: 60 requests / 1 min / user (game actions)
 */
import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { logger } from '../utils/logger';

// --- Rate Limiter Instances ---

// Auth: 5 per 15 min (very strict)
export const rateLimiterAuth = new RateLimiterMemory({
  points: 5,
  duration: 15 * 60, // 15 minutes
  keyPrefix: 'rl_auth',
});

// API: 100 per min (general)
export const rateLimiterApi = new RateLimiterMemory({
  points: 100,
  duration: 60,
  keyPrefix: 'rl_api',
});

// Financial: 10 per min (per user IP + user ID combo)
export const rateLimiterFinancial = new RateLimiterMemory({
  points: 10,
  duration: 60,
  keyPrefix: 'rl_fin',
});

// Game: 60 per min (per user)
export const rateLimiterGame = new RateLimiterMemory({
  points: 60,
  duration: 60,
  keyPrefix: 'rl_game',
});

// --- Middleware Generators ---

function createRateLimiterMiddleware(
  rateLimiter: RateLimiterMemory,
  tierName: string,
  getKey: (req: Request) => string
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = getKey(req);

    try {
      await rateLimiter.consume(key);
      next();
    } catch (rejRes as any: any) {
      const rateLimiterRes: RateLimiterRes = rejRes;
      const retryAfter = Math.ceil(rateLimiterRes.msBeforeNext / 1000);

      logger.warn(
        {
          req: req.originalUrl,
          ip: req.ip,
          key,
          tier: tierName,
          retryAfter,
        },
        'Rate limit exceeded'
      );

      res.status(429).json({
        error: 'Trop de requêtes. Veuillez réessayer plus tard.',
        retryAfter,
        tier: tierName,
      });
    }
  };
}

// Key generators
const getAuthKey = (req: Request) => req.ip || 'unknown_ip';
const getApiKey = (req: Request) => req.ip || 'unknown_ip';
const getFinancialKey = (req: Request) => `${req.ip}_${(req as any).userId || 'no_user'}`;
const getGameKey = (req: Request) => `${req.ip}_${(req as any).userId || 'no_user'}`;

export const rateLimitAuth = createRateLimiterMiddleware(rateLimiterAuth, 'auth', getAuthKey);
export const rateLimitApi = createRateLimiterMiddleware(rateLimiterApi, 'api', getApiKey);
export const rateLimitFinancial = createRateLimiterMiddleware(rateLimiterFinancial, 'financial', getFinancialKey);
export const rateLimitGame = createRateLimiterMiddleware(rateLimiterGame, 'game', getGameKey);
