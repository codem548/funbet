/**
 * FunBet Casino — Error Handler Middleware
 *
 * Centralized error handling. Converts thrown errors into safe JSON responses.
 * Logs full error details server-side, returns generic message to client.
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async wrapper — catches promise rejections in async route handlers.
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not-found handler — should be registered after all routes.
 */
export function notFound(req: Request, res: Response) {
  res.status(404).json({
    error: 'Ressource introuvable.',
    path: req.path,
  });
}

/**
 * Global error handler.
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Already handled response
  if (res.headersSent) {
    return next(err);
  }

  const status = err instanceof AppError ? err.statusCode : 500;
  const isOperational = err instanceof AppError && err.isOperational;

  // Log full error
  if (!isOperational) {
    logger.error({
      err,
      stack: err.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params,
    });
  } else {
    logger.warn({
      message: err.message,
      url: req.url,
      method: req.method,
      statusCode: status,
    });
  }

  // Safe error response to client
  const isDev = process.env.NODE_ENV === 'development';
  res.status(status).json({
    error: err.message || 'Erreur interne du serveur.',
    ...(isDev && !isOperational ? { stack: err.stack } : {}),
  });
}
