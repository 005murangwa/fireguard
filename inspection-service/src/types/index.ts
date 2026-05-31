/**
 * Type Definitions — Inspection Service
 *
 * WHAT: Shared TypeScript interfaces for JWT payloads and cross-service status sync.
 * WHY:  Keeps middleware, controllers, and HTTP clients aligned on the same shapes.
 */

/** Platform roles — must match auth-service JWT claims. */
export type UserRole = 'ADMIN' | 'INSPECTOR' | 'CLIENT';

/**
 * JWT payload decoded from Bearer tokens issued by auth-service.
 * inspectorId on inspection records maps to userId from this payload.
 */
export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

/**
 * Extinguisher statuses accepted by fire-extinguisher-service internal PATCH API.
 * Inspection results may push ACTIVE, INSPECTION_DUE, or UNDER_MAINTENANCE.
 */
export type ExtinguisherSyncStatus =
  | 'ACTIVE'
  | 'EXPIRED'
  | 'UNDER_MAINTENANCE'
  | 'INSPECTION_DUE';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
