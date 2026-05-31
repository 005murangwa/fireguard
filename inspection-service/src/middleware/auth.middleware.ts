/**
 * JWT Authentication & Role Middleware — Inspection Service
 *
 * WHAT: Verifies Bearer JWT and enforces role-based access control.
 * ROLES:
 *   - INSPECTOR: Create/update own inspections; read own records + history
 *   - ADMIN:     Full CRUD on all inspection records
 * HOW:  Uses shared JWT_SECRET — same tokens issued by auth-service login.
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '../types';
import { getInspectorIdForInspection } from '../services/inspection.service';

/**
 * Verifies Authorization: Bearer <token> and attaches decoded payload to req.user.
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
 * Factory middleware — restricts route to one or more allowed roles.
 *
 * @param roles - Spread list of permitted UserRole values (e.g. 'ADMIN', 'INSPECTOR')
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
 * Ensures INSPECTOR can only modify their own inspection records.
 * ADMIN bypasses this check — full access to all records.
 *
 * Use on PATCH /inspections/:id and GET /inspections/:id routes.
 */
export function requireOwnInspectionOrAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  if (req.user.role === 'ADMIN') {
    next();
    return;
  }

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid inspection ID', code: 'INVALID_ID' });
    return;
  }

  getInspectorIdForInspection(id)
    .then((inspectorId) => {
      if (inspectorId !== req.user!.userId) {
        res.status(403).json({
          error: 'You can only access your own inspection records',
          code: 'FORBIDDEN',
        });
        return;
      }
      next();
    })
    .catch(() => {
      res.status(404).json({ error: 'Inspection not found', code: 'NOT_FOUND' });
    });
}
