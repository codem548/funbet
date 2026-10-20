/**
 * FunBet Casino — Security Middleware
 *
 * - Helmet: sets secure HTTP headers
 * - HSTS: enforces HTTPS
 * - CORS: configurable origins
 * - HPP: HTTP Parameter Pollution prevention
 */
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import { env } from '../config/env';

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://"],
      connectSrc: ["'self'", "ws://", "wss://"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  maxAge: 86400, // 24 hours
});

export const hppMiddleware = hpp({
  whitelist: ['sort', 'order', 'page', 'limit'],
});

/**
 * Request ID middleware — adds unique ID to each request for tracing.
 */
export function requestId() {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    (req as any).requestId = id;
    res.setHeader('X-Request-Id', id);
    next();
  };
}

/**
 * Security headers for Socket.IO WebSocket handshake.
 */
export function wsSecurityHeaders(req: any, res: any, next: any) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
}
