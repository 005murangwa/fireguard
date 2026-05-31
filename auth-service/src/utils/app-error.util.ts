/**
 * =============================================================================
 * FireGuard LTD — Application Error Helper
 * =============================================================================
 * WHAT:  Custom Error subclass carrying HTTP status codes for the API layer.
 * WHY:  Services throw AppError with semantic status (404, 401, etc.) and the
 *        global error middleware converts them to consistent JSON responses.
 * HOW:  throw new AppError('Email already registered', 409) in service code.
 * =============================================================================
 */

/**
 * Operational error with an explicit HTTP status code.
 * Non-AppError exceptions fall through to the 500 handler in error.middleware.
 */
export class AppError extends Error {
  /** HTTP status code sent to the client (e.g. 400, 401, 404, 409). */
  public readonly statusCode: number;

  /** Optional extra payload (e.g. Zod validation issues). */
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;

    // Restore prototype chain for `instanceof AppError` checks in Node
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Factory for common 400 Bad Request errors — keeps service code readable.
 */
export function badRequest(message: string, details?: unknown): AppError {
  return new AppError(message, 400, details);
}

/**
 * Factory for 401 Unauthorized — wrong credentials or unverified account.
 */
export function unauthorized(message: string): AppError {
  return new AppError(message, 401);
}

/**
 * Factory for 404 Not Found — user or OTP record missing.
 */
export function notFound(message: string): AppError {
  return new AppError(message, 404);
}

/**
 * Factory for 409 Conflict — duplicate email on signup.
 */
export function conflict(message: string): AppError {
  return new AppError(message, 409);
}
