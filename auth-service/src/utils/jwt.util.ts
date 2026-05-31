/**
 * =============================================================================
 * FireGuard LTD — JWT Token Utilities
 * =============================================================================
 * WHAT:  Signs and verifies JSON Web Tokens for authenticated sessions.
 * WHY:  Stateless JWTs let the API Gateway and other microservices validate
 *        identity without hitting the auth DB on every request.
 * HOW:  signToken() after login/verify-otp; verifyToken() in auth middleware.
 * =============================================================================
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import { JwtPayload } from '../types';

/**
 * Read JWT configuration from environment.
 * Throws at runtime if JWT_SECRET is missing — fail fast on misconfiguration.
 */
function getJwtConfig(): { secret: string; expiresIn: string } {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }

  return {
    secret,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  };
}

/**
 * Create a signed JWT containing user identity claims.
 *
 * @param payload - userId, email, role, firstName, lastName
 * @returns Bearer token string for Authorization header
 */
export function signToken(payload: JwtPayload): string {
  const { secret, expiresIn } = getJwtConfig();

  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions['expiresIn'],
    subject: String(payload.userId),
  };

  return jwt.sign(payload, secret, options);
}

/**
 * Validate and decode a JWT from the Authorization header.
 *
 * @param token - Raw token without "Bearer " prefix
 * @returns Decoded payload when signature and expiry are valid
 * @throws jsonwebtoken.JsonWebTokenError on invalid/expired tokens
 */
export function verifyToken(token: string): JwtPayload {
  const { secret } = getJwtConfig();
  return jwt.verify(token, secret) as JwtPayload;
}
