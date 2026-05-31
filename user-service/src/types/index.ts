/**
 * =============================================================================
 * FireGuard LTD — User Service Type Definitions
 * =============================================================================
 * WHAT:  Central TypeScript interfaces for JWT payloads, API responses, and
 *        pagination wrappers used across controllers, services, and middleware.
 * WHY:  Keeps layers aligned on the same shapes without circular imports.
 * HOW:  Import from '../types' anywhere you need strongly typed user data.
 * =============================================================================
 */

import { Role } from '@prisma/client';

/**
 * Safe user representation returned by the API — never includes password hash.
 * Field names match auth-service PublicUser for cross-service consistency.
 */
export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: Role;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * JWT payload shape — must match tokens issued by auth-service after login.
 * Other microservices decode the same payload using the shared JWT_SECRET.
 */
export interface JwtPayload {
  userId: number;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
}

/**
 * Aggregated dashboard statistics for admin user management widgets.
 */
export interface UserStats {
  total: number;
  admins: number;
  inspectors: number;
  clients: number;
  verified: number;
  unverified: number;
  createdLast30Days: number;
}

/**
 * Paginated list wrapper for GET /users collection endpoint.
 */
export interface PaginatedUsers {
  data: UserResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Structured API error JSON shape produced by the global error handler.
 */
export interface ApiErrorBody {
  success: false;
  error: string;
  code?: string;
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
