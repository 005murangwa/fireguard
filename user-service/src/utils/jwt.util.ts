/**
 * =============================================================================
 * FireGuard LTD — JWT Token Utilities (User Service)
 * =============================================================================
 * WHAT:  Verifies JSON Web Tokens issued by auth-service.
 * WHY:  User-service does not sign tokens — it only validates incoming Bearer
 *        tokens using the shared JWT_SECRET to enforce ADMIN-only access.
 * HOW:  verifyToken() in auth middleware; must match auth-service payload shape.
 * =============================================================================
 */

import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

/**
 * Read JWT configuration from environment.
 * Throws at runtime if JWT_SECRET is missing — fail fast on misconfiguration.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
  return secret;
}

/**
 * Validate and decode a JWT from the Authorization header.
 *
 * @param token - Raw token without "Bearer " prefix
 * @returns Decoded payload when signature and expiry are valid
 * @throws jsonwebtoken.JsonWebTokenError on invalid/expired tokens
 */
export function verifyToken(token: string): JwtPayload {
  const secret = getJwtSecret();
  return jwt.verify(token, secret) as JwtPayload;
}
