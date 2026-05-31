/**
 * Zod Validation Middleware — Inspection Service
 *
 * WHAT: Express wrappers that validate body, query, and route params via Zod.
 * WHY:  Keeps controllers thin — validation rules live in dto/*.ts files.
 */
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/** Validates req.body; replaces body with parsed/coerced values on success. */
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

/** Validates req.query and stores result on req.validatedQuery. */
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

/** Validates req.params and stores result on req.validatedParams. */
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
