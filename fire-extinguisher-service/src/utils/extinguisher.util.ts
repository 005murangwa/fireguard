/**
 * =============================================================================
 * FireGuard LTD - Fire Extinguisher Utility Helpers
 * =============================================================================
 * Pure functions for formatting, status calculation, and pagination math.
 * =============================================================================
 */

import { FireExtinguisher, ExtinguisherStatus } from '@prisma/client';
import { FireExtinguisherResponse } from '../types';

/** Number of days before expiry when status becomes INSPECTION_DUE. */
const INSPECTION_DUE_DAYS = 30;

/**
 * Maps a Prisma FireExtinguisher entity to the public API response shape.
 *
 * @param record - Database row from Prisma
 */
export function formatExtinguisher(record: FireExtinguisher): FireExtinguisherResponse {
  return {
    id: record.id,
    extinguisherCode: record.extinguisherCode,
    type: record.type,
    manufacturer: record.manufacturer,
    capacity: record.capacity,
    installationLocation: record.installationLocation,
    manufacturingDate: record.manufacturingDate,
    expirationDate: record.expirationDate,
    status: record.status,
    assignedClientId: record.assignedClientId,
    qrCodeData: record.qrCodeData,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Derives extinguisher status from expiration date unless manually overridden.
 * UNDER_MAINTENANCE is never auto-set — admins set it explicitly.
 *
 * @param expirationDate - Unit expiration date
 * @param currentStatus - Existing status (preserves UNDER_MAINTENANCE)
 */
export function calculateStatus(
  expirationDate: Date,
  currentStatus?: ExtinguisherStatus
): ExtinguisherStatus {
  // Manual maintenance flag takes precedence over date-based logic
  if (currentStatus === ExtinguisherStatus.UNDER_MAINTENANCE) {
    return ExtinguisherStatus.UNDER_MAINTENANCE;
  }

  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilExpiry = Math.ceil((expirationDate.getTime() - now.getTime()) / msPerDay);

  if (daysUntilExpiry <= 0) {
    return ExtinguisherStatus.EXPIRED;
  }

  if (daysUntilExpiry <= INSPECTION_DUE_DAYS) {
    return ExtinguisherStatus.INSPECTION_DUE;
  }

  return ExtinguisherStatus.ACTIVE;
}

/**
 * Parses ISO date strings or YYYY-MM-DD into Date objects at UTC midnight.
 *
 * @param dateStr - Date string from request body
 */
export function parseDate(dateStr: string): Date {
  if (dateStr.includes('T')) {
    return new Date(dateStr);
  }
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/**
 * Computes total pages for offset pagination.
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit) || 1;
}

/**
 * Generates a unique extinguisher code when none is supplied on create.
 * Format: FG-{timestamp base36}-{random suffix}
 */
export function generateExtinguisherCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FG-${timestamp}-${random}`;
}
