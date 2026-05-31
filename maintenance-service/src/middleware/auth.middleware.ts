/**
 * JWT Authentication Middleware — Maintenance Service
 *
 * WHAT: Verifies Bearer JWT tokens from auth-service.
 * WHY:  All maintenance endpoints require ADMIN role (enforced in routes).
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '../types';

/** Verifies JWT and attaches decoded user claims to req.user. */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'JWT secret not configured', code: 'CONFIG_ERROR' });
    return;
  }

  try {
    req.user = jwt.verify(authHeader.split(' ')[1], secret) as JwtPayload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
  }
}

/** Restricts access to specified roles — maintenance routes use requireRole('ADMIN'). */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Access denied — admin privileges required',
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
}
