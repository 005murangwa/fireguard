/**
 * =============================================================================
 * FireGuard LTD - User Service Validation Middleware
 * =============================================================================
 * WHAT: Express middleware wrappers around Zod schemas.
 * WHY:  Keeps controllers thin — validation logic lives in validators/*.ts.
 * =============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Validates req.body against a Zod schema.
 * On failure returns 400 with field-level error details.
 *
 * @param schema - Zod schema for request body
 */
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

    // Replace body with parsed/coerced values (e.g. trimmed strings)
    req.body = result.data;
    next();
  };
}

/**
 * Validates req.query against a Zod schema.
 * Used for pagination and filter query parameters on list endpoints.
 *
 * @param schema - Zod schema for query string
 */
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

    // Store validated query on req for controller access
    (req as Request & { validatedQuery?: T }).validatedQuery = result.data;
    next();
  };
}

/**
 * Validates req.params against a Zod schema (e.g. numeric :id).
 *
 * @param schema - Zod schema for route parameters
 */
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
