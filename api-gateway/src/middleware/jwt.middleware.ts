/**
 * JWT middleware — validates Bearer token on all protected gateway routes.
 * Business rule: expired or tampered tokens are rejected with 401.
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function jwtMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
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
