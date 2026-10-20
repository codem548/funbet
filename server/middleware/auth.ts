/**
 * FunBet Casino — Authentication Middleware
 *
 * Validates JWT access tokens on protected routes.
 * Extracts userId from token and attaches to request.
 */
import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayloadExtended } from '../utils/crypto';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        isAdmin: boolean;
      };
    }
  }
}

/**
 * Middleware: Require valid JWT access token.
 * Reads from `Authorization: Bearer <token>` header or `token` query param.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : req.query.token as string;

  if (!token) {
    return res.status(401).json({ error: 'Token d\'authentification requis.' });
  }

  const payload = verifyToken(token) as JwtPayloadExtended | null;

  if (!payload || payload.type !== 'access') {
    logger.warn({ ip: req.ip, path: req.path }, 'Invalid or expired token');
    return res.status(401).json({ error: 'Token invalide ou expiré.' });
  }

  req.user = {
    userId: payload.userId,
    username: payload.username,
    isAdmin: payload.isAdmin,
  };

  next();
}

/**
 * Middleware: Require admin privileges.
 * Must be used after requireAuth.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentification requise.' });
  }

  if (!req.user.isAdmin) {
    logger.warn({ userId: req.user.userId, path: req.path }, 'Unauthorized admin access attempt');
    return res.status(403).json({ error: 'Accès administrateur requis.' });
  }

  next();
}

/**
 * Middleware: Require a valid session token (optional, for Socket.IO handshake).
 */
export function requireSocketAuth(token: string) {
  const payload = verifyToken(token) as JwtPayloadExtended | null;
  if (!payload || payload.type !== 'access') {
    return null;
  }
  return {
    userId: payload.userId,
    username: payload.username,
    isAdmin: payload.isAdmin,
  };
}
