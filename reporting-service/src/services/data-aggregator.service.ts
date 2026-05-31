/**
 * =============================================================================
 * FireGuard LTD — Cross-Service Data Aggregator
 * =============================================================================
 * Fetches and normalizes data from upstream microservices via HTTP.
 * Each fetch function returns an empty array / default stats on failure so
 * PDF generation can still produce a partial report when a service is offline.
 * =============================================================================
 */

import axios from 'axios';

/** Service base URLs from environment. */
const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const USER_URL = process.env.USER_SERVICE_URL || 'http://localhost:5002';
const FIRE_EXT_URL = process.env.FIRE_EXTINGUISHER_SERVICE_URL || 'http://localhost:5003';
const INSPECTION_URL = process.env.INSPECTION_SERVICE_URL || 'http://localhost:5004';
const MAINTENANCE_URL = process.env.MAINTENANCE_SERVICE_URL || 'http://localhost:5005';
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5006';

/** Normalized fire extinguisher record for report rendering. */
export interface ExtinguisherRow {
  extinguisherCode: string;
  type: string;
  manufacturer: string;
  capacity: string;
  installationLocation: string;
  expirationDate: string;
  status: string;
  assignedClientId: number | null;
}

/** Normalized inspection record. */
export interface InspectionRow {
  extinguisherCode: string;
  inspectorId: number;
  inspectionDate: string;
  condition: string;
  nextInspectionDate: string;
  remarks: string | null;
}

/** Normalized maintenance record. */
export interface MaintenanceRow {
  extinguisherCode: string;
  maintenanceDate: string;
  description: string;
  technician: string;
  status: string;
}

/** System-wide statistics bundle for the statistics report. */
export interface SystemStatistics {
  users: { total: number; admins: number; clients: number; inspectors: number };
  extinguishers: { total: number; active: number; expired: number; inspectionDue: number; underMaintenance: number };
  inspections: { total: number; dueThisMonth: number };
  maintenance: { total: number; scheduled: number; completed: number };
  notifications: { total: number; unread: number };
  generatedAt: string;
}

/** Generic GET helper with error logging. */
async function safeGet<T>(url: string, fallback: T): Promise<T> {
  try {
    const response = await axios.get(url);
    return response.data as T;
  } catch (error) {
    console.warn(`[Aggregator] GET ${url} failed — using fallback`);
    return fallback;
  }
}

/** Fetch all extinguishers with EXPIRED status. */
export async function fetchExpiredExtinguishers(): Promise<ExtinguisherRow[]> {
  return safeGet<ExtinguisherRow[]>(`${FIRE_EXT_URL}/internal/expired`, []);
}

/** Fetch extinguishers expiring within the next N days (default 30). */
export async function fetchUpcomingExpirations(days = 30): Promise<ExtinguisherRow[]> {
  return safeGet<ExtinguisherRow[]>(`${FIRE_EXT_URL}/internal/expiring?days=${days}`, []);
}

/** Fetch all inspection records for the inspection report. */
export async function fetchAllInspections(): Promise<InspectionRow[]> {
  return safeGet<InspectionRow[]>(`${INSPECTION_URL}/internal/all`, []);
}

/** Fetch all maintenance records for the maintenance report. */
export async function fetchAllMaintenance(): Promise<MaintenanceRow[]> {
  return safeGet<MaintenanceRow[]>(`${MAINTENANCE_URL}/internal/all`, []);
}

/**
 * Aggregate system-wide statistics from all microservices.
 * Each sub-stat is fetched independently — partial data is acceptable.
 */
export async function fetchSystemStatistics(): Promise<SystemStatistics> {
  const [userStats, extStats, inspectionStats, maintenanceStats, notificationStats] =
    await Promise.all([
      safeGet<{ total: number; admins: number; clients: number; inspectors: number }>(
        `${USER_URL}/internal/stats`,
        { total: 0, admins: 0, clients: 0, inspectors: 0 }
      ),
      safeGet<{
        total: number;
        active: number;
        expired: number;
        inspectionDue: number;
        underMaintenance: number;
      }>(`${FIRE_EXT_URL}/internal/stats`, {
        total: 0,
        active: 0,
        expired: 0,
        inspectionDue: 0,
        underMaintenance: 0,
      }),
      safeGet<{ total: number; dueThisMonth: number }>(`${INSPECTION_URL}/internal/stats`, {
        total: 0,
        dueThisMonth: 0,
      }),
      safeGet<{ total: number; scheduled: number; completed: number }>(
        `${MAINTENANCE_URL}/internal/stats`,
        { total: 0, scheduled: 0, completed: 0 }
      ),
      safeGet<{ total: number; unread: number }>(`${NOTIFICATION_URL}/internal/stats`, {
        total: 0,
        unread: 0,
      }),
    ]);

  // Auth service stats are optional — user-service is primary source
  void AUTH_URL;

  return {
    users: userStats,
    extinguishers: extStats,
    inspections: inspectionStats,
    maintenance: maintenanceStats,
    notifications: notificationStats,
    generatedAt: new Date().toISOString(),
  };
}
