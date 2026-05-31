/**
 * =============================================================================
 * FireGuard LTD — Application Error Helper
 * =============================================================================
 * WHAT:  Custom Error subclass carrying HTTP status codes for the API layer.
 * WHY:  Services throw AppError with semantic status (404, 401, etc.) and the
 *        global error middleware converts them to consistent JSON responses.
 * HOW:  throw new AppError('User not found', 404, 'USER_NOT_FOUND') in services.
 * =============================================================================
 */

/**
 * Operational error with an explicit HTTP status code and optional error code.
 * Non-AppError exceptions fall through to the 500 handler in error.middleware.
 */
export class AppError extends Error {
  /** HTTP status code sent to the client (e.g. 400, 401, 404, 409). */
  public readonly statusCode: number;

  /** Machine-readable error code for frontend i18n / logging. */
  public readonly code: string;

  /** Optional extra payload (e.g. Zod validation issues). */
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // Restore prototype chain for `instanceof AppError` checks in Node
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Factory for 400 Bad Request — keeps service code readable. */
export function badRequest(message: string, code = 'BAD_REQUEST', details?: unknown): AppError {
  return new AppError(message, 400, code, details);
}

/** Factory for 401 Unauthorized — missing or invalid JWT. */
export function unauthorized(message: string, code = 'UNAUTHORIZED'): AppError {
  return new AppError(message, 401, code);
}

/** Factory for 403 Forbidden — authenticated but insufficient role. */
export function forbidden(message: string, code = 'FORBIDDEN'): AppError {
  return new AppError(message, 403, code);
}

/** Factory for 404 Not Found — user record missing. */
export function notFound(message: string, code = 'NOT_FOUND'): AppError {
  return new AppError(message, 404, code);
}

/** Factory for 409 Conflict — duplicate email on update. */
export function conflict(message: string, code = 'CONFLICT'): AppError {
  return new AppError(message, 409, code);
}
