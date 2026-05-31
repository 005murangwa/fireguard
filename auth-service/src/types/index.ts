/**
 * =============================================================================
 * FireGuard LTD — Shared TypeScript Types
 * =============================================================================
 * WHAT:  Central type definitions for JWT payloads, API responses, and errors.
 * WHY:  Keeps controllers, middleware, and services aligned on the same shapes
 *        without circular imports between layers.
 * HOW:  Import from '../types' anywhere you need strongly typed auth data.
 * =============================================================================
 */

import { Role } from '@prisma/client';

/**
 * Claims embedded inside every JWT issued after successful login or OTP verify.
 * Other microservices decode the same payload using JWT_SECRET.
 */
export interface JwtPayload {
  userId: number;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
}

/**
 * Safe user object returned to clients — password hash is never included.
 */
export interface PublicUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: Role;
  isVerified: boolean;
  createdAt: Date;
}

/**
 * Standard login / verify-otp success body containing token + profile.
 */
export interface AuthResponse {
  message: string;
  token: string;
  user: PublicUser;
}

/**
 * Signup success body — no token until email is verified via OTP.
 */
export interface SignupResponse {
  message: string;
  email: string;
}

/**
 * Generic success message for resend-otp and similar operations.
 */
export interface MessageResponse {
  message: string;
}

/**
 * Structured API error JSON shape produced by the global error handler.
 */
export interface ApiErrorBody {
  success: false;
  error: string;
  details?: unknown;
}

/**
 * Extend Express Request so middleware can attach decoded JWT user claims.
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
