/**
 * =============================================================================
 * FireGuard LTD — Fire Extinguisher Service Global Error Handler
 * =============================================================================
 * WHAT:  Central Express error middleware for consistent JSON error responses.
 * WHY:  Keeps 404 and unexpected failures uniform across all routes.
 * HOW:  Register after routes in app.ts: notFoundHandler then errorHandler.
 * =============================================================================
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 404 handler for undefined routes — placed before errorHandler in app.ts.
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: 'Route not found',
    code: 'NOT_FOUND',
  });
}

/**
 * Express error middleware (4-arg signature) for forwarded errors.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[fire-extinguisher-service] Unhandled error:', err);

  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error
        ? err.message
        : 'Internal server error';

  res.status(500).json({
    error: message,
    code: 'INTERNAL_ERROR',
  });
}
