/**
 * Type Definitions — Maintenance Service
 *
 * WHAT: Shared enums and JWT interfaces for the maintenance microservice.
 * WHY:  Prisma generates MaintenanceStatus; we re-export a string union for services.
 */

/** Lifecycle states for a maintenance work order (mirrors Prisma enum). */
export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

/** Platform roles — maintenance endpoints are ADMIN-only. */
export type UserRole = 'ADMIN' | 'INSPECTOR' | 'CLIENT';

/** JWT payload from auth-service login tokens. */
export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

/** Status values sent to fire-extinguisher-service internal API. */
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
