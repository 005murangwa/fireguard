/**
 * =============================================================================
 * FireGuard LTD - User Service Authentication Middleware
 * =============================================================================
 * WHAT: JWT verification and role-based access control (RBAC).
 * WHY:  All user management endpoints are ADMIN-only per business requirements.
 * HOW:  Reads Bearer token, verifies with JWT_SECRET, attaches payload to req.user.
 * =============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { JwtPayload } from '../types';

/** Extend Express Request so downstream handlers can access req.user safely. */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Verifies JWT Bearer token from Authorization header.
 * Rejects with 401 when token is missing, invalid, or expired.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  // Require standard Bearer scheme — e.g. "Authorization: Bearer eyJhbG..."
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({
      error: 'JWT secret not configured',
      code: 'CONFIG_ERROR',
    });
    return;
  }

  try {
    // Attach decoded payload — same shape auth-service uses when signing tokens
    req.user = jwt.verify(token, secret) as JwtPayload;
    next();
  } catch {
    res.status(401).json({
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
    });
  }
}

/**
 * Factory middleware that restricts access to specific roles.
 * User-service endpoints use requireRole(Role.ADMIN) exclusively.
 *
 * @param roles - Allowed roles for the route (spread one or more Role values)
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
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
