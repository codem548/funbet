/**
 * FunBet Casino — Request Validation Middleware (Zod)
 */
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Create a validation middleware from a Zod schema.
 * Validates request body against the schema.
 */
export function validate(schema: ZodSchema): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          error: 'Données invalides.',
          details: errors,
        });
      }
      next(err);
    }
  };
}

/**
 * Validate request params against a Zod schema.
 */
export function validateParams(schema: ZodSchema): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Paramètres invalides.',
          details: err.errors,
        });
      }
      next(err);
    }
  };
}

/**
 * Validate request query against a Zod schema.
 */
export function validateQuery(schema: ZodSchema): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Paramètres de requête invalides.',
          details: err.errors,
        });
      }
      next(err);
    }
  };
}
