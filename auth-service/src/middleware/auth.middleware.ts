/**
 * =============================================================================
 * FireGuard LTD — JWT Authentication Middleware
 * =============================================================================
 * WHAT:  Protects routes by requiring a valid Bearer JWT in Authorization header.
 * WHY:  Some auth endpoints (e.g. future profile routes) need the logged-in user
 *        without re-querying the database; JWT carries userId + role claims.
 * HOW:  authMiddleware decodes token; requireRole() restricts by Role enum.
 * =============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyToken } from '../utils/jwt.util';
import { AppError } from '../utils/app-error.util';

/**
 * Require `Authorization: Bearer <token>` and attach decoded JWT to req.user.
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError('Authentication required', 401));
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}

/**
 * Role-based guard — must run after authMiddleware.
 *
 * @param roles - Allowed Role values (ADMIN, INSPECTOR, CLIENT)
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new AppError('Access denied — insufficient permissions', 403));
      return;
    }
    next();
  };
}
