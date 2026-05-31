/**
 * =============================================================================
 * FireGuard LTD — JWT Authentication Middleware
 * =============================================================================
 * Validates Bearer tokens issued by auth-service and attaches decoded payload
 * to `req.user` for downstream route handlers.
 * =============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/** Shape of JWT payload shared across all FireGuard LTD microservices. */
export interface JwtPayload {
  userId: number;
  email: string;
  role: 'ADMIN' | 'INSPECTOR' | 'CLIENT';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Require a valid JWT in the Authorization header.
 * Responds 401 when missing/invalid, 500 when JWT_SECRET is not configured.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'JWT secret not configured' });
    return;
  }

  try {
    req.user = jwt.verify(authHeader.split(' ')[1], secret) as JwtPayload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Role guard factory — must run AFTER authMiddleware.
 * Example: requireRole('ADMIN') for admin-only cron trigger.
 */
export function requireRole(...roles: Array<JwtPayload['role']>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Access denied — insufficient role' });
      return;
    }
    next();
  };
}

/**
 * Verify JWT from a raw token string (used by WebSocket handshake).
 * Returns null when verification fails.
 */
export function verifyToken(token: string): JwtPayload | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return null;
  }

  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch {
    return null;
  }
}
