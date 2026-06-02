
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


