/**
 * =============================================================================
 * FireGuard LTD — Global Error Handler Middleware
 * =============================================================================
 * WHAT:  Central Express error middleware that formats all failures as JSON.
 * WHY:  Controllers and services throw AppError or pass errors to next(err);
 *        this layer ensures consistent `{ success: false, error }` responses
 *        and prevents stack traces leaking to clients in production.
 * HOW:  Registered last in app.ts after all routes: app.use(errorHandler).
 * =============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error.util';

/**
 * Express recognizes error middleware by the 4-argument signature (err, req, res, next).
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Operational errors thrown intentionally from services
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  // Unexpected programmer errors — log full stack server-side
  console.error('[auth-service] Unhandled error:', err);

  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error
        ? err.message
        : 'Internal server error';

  res.status(500).json({
    success: false,
    error: message,
  });
}

/**
 * 404 handler for undefined routes — placed before errorHandler in app.ts.
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
}
