/**
 * =============================================================================
 * FireGuard LTD - Fire Extinguisher Service Type Definitions
 * =============================================================================
 * Shared interfaces for JWT payloads, API responses, and pagination wrappers.
 * =============================================================================
 */

import { ExtinguisherStatus } from '@prisma/client';

/** Supported platform roles — INSPECTOR included for field inspection access. */
export type UserRole = 'ADMIN' | 'INSPECTOR' | 'CLIENT';

/**
 * JWT payload — must align with tokens issued by auth-service.
 * INSPECTOR role is used when inspectors authenticate via the platform.
 */
export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

/** Public API representation of a fire extinguisher record. */
export interface FireExtinguisherResponse {
  id: number;
  extinguisherCode: string;
  type: string;
  manufacturer: string;
  capacity: string;
  installationLocation: string;
  manufacturingDate: Date;
  expirationDate: Date;
  status: ExtinguisherStatus;
  assignedClientId: number | null;
  qrCodeData: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Paginated list response for collection endpoints. */
export interface PaginatedExtinguishers {
  data: FireExtinguisherResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Minimal scan result returned by GET /scan/:code (QR lookup). */
export interface ScanResult {
  extinguisherCode: string;
  type: string;
  installationLocation: string;
  status: ExtinguisherStatus;
  expirationDate: Date;
  assignedClientId: number | null;
}
