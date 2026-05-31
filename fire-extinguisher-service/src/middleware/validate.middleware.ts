/**
 * =============================================================================
 * FireGuard LTD - Fire Extinguisher Validation Middleware
 * =============================================================================
 * Express wrappers around Zod schemas for body, query, and params validation.
 * =============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/** Validates request body against a Zod schema. */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

/** Validates query string parameters. */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      res.status(400).json({
        error: 'Invalid query parameters',
        code: 'VALIDATION_ERROR',
        details: result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    (req as Request & { validatedQuery?: T }).validatedQuery = result.data;
    next();
  };
}

/** Validates route parameters (e.g. :id, :code). */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      res.status(400).json({
        error: 'Invalid route parameters',
        code: 'VALIDATION_ERROR',
        details: result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    (req as Request & { validatedParams?: T }).validatedParams = result.data;
    next();
  };
}
