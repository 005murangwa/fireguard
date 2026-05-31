/**
 * =============================================================================
 * FireGuard LTD — Request Body Validation Middleware
 * =============================================================================
 * WHAT:  Express middleware factory that validates req.body with a Zod schema.
 * WHY:  Keeps controllers free of manual `if (!email)` checks; Zod produces
 *        structured error details consumed by the global error handler.
 * HOW:  router.post('/signup', validateBody(signupSchema), signupHandler)
 * =============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/app-error.util';

/**
 * Returns middleware that parses and replaces req.body with validated data.
 *
 * @param schema - Zod object schema from src/validators
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // parse() throws ZodError; coerced/transformed values replace req.body
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new AppError('Validation failed', 400, error.errors.map((e) => ({
            field: e.path.join('.') || 'body',
            message: e.message,
          })))
        );
        return;
      }
      next(error);
    }
  };
}
