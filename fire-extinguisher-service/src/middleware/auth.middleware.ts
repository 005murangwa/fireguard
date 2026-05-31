/**
 * =============================================================================
 * FireGuard LTD - Fire Extinguisher Authentication & Authorization Middleware
 * =============================================================================
 * WHAT: JWT verification and role-based access control.
 * ROLES:
 *   - ADMIN:     Full CRUD on all extinguishers
 *   - INSPECTOR: Read-only access to assigned (client-deployed) units
 *   - CLIENT:    Read-only access to units where assignedClientId = userId
 * =============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Verifies Bearer JWT and attaches decoded payload to req.user.
 */
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

/**
 * Restricts route access to one or more allowed roles.
 *
 * @param roles - Spread list of permitted UserRole values
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
      return;
    }

    next();
  };
}

/**
 * Ensures non-admin users can only access extinguishers they are assigned to.
 * ADMIN bypasses this check entirely.
 *
 * INSPECTOR: may read units that have a client assignment (deployed in the field).
 * CLIENT:    may read only units where assignedClientId matches their userId.
 *
 * @param extinguisher - Record fetched from database (must include assignedClientId)
 */
export function canAccessExtinguisher(
  user: JwtPayload,
  extinguisher: { assignedClientId: number | null }
): boolean {
  if (user.role === 'ADMIN') {
    return true;
  }

  if (user.role === 'CLIENT') {
    return extinguisher.assignedClientId === user.userId;
  }

  if (user.role === 'INSPECTOR') {
    // Inspectors access client-deployed units (assignedClientId is set)
    return extinguisher.assignedClientId !== null;
  }

  return false;
}
