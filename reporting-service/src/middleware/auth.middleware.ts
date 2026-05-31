/**
 * =============================================================================
 * FireGuard LTD — JWT Authentication Middleware (Reporting Service)
 * =============================================================================
 * All report endpoints require ADMIN role — reports contain system-wide data
 * that must not be exposed to clients or inspectors.
 * =============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/** JWT payload shape shared across FireGuard LTD services. */
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

/** Validate Bearer JWT and attach decoded user to request. */
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

/** Restrict route to ADMIN role only. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Access denied — ADMIN role required' });
    return;
  }
  next();
}
