/**
 * =============================================================================
 * FireGuard LTD — Upstream HTTP Clients
 * =============================================================================
 * Axios wrappers for calling other microservices during cron jobs and
 * email resolution. Each function fails gracefully (logs + returns empty)
 * when an upstream service is unavailable so one outage does not crash cron.
 * =============================================================================
 */

import axios from 'axios';

/** Base URLs read from environment with sensible local defaults. */
const FIRE_EXTINGUISHER_URL =
  process.env.FIRE_EXTINGUISHER_SERVICE_URL || 'http://localhost:5003';
const INSPECTION_URL = process.env.INSPECTION_SERVICE_URL || 'http://localhost:5004';
const MAINTENANCE_URL = process.env.MAINTENANCE_SERVICE_URL || 'http://localhost:5005';
const USER_URL = process.env.USER_SERVICE_URL || 'http://localhost:5002';

/** Fire extinguisher record shape returned by fire-extinguisher-service. */
export interface FireExtinguisherRecord {
  id: number;
  extinguisherCode: string;
  type: string;
  manufacturer: string;
  capacity: string;
  installationLocation: string;
  manufacturingDate: string;
  expirationDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'UNDER_MAINTENANCE' | 'INSPECTION_DUE';
  assignedClientId: number | null;
}

/** Inspection record with upcoming due date. */
export interface InspectionDueRecord {
  id: number;
  extinguisherCode: string;
  inspectorId: number;
  inspectionDate: string;
  condition: string;
  nextInspectionDate: string;
  assignedClientId?: number | null;
}

/** Maintenance reminder record. */
export interface MaintenanceReminderRecord {
  id: number;
  extinguisherCode: string;
  maintenanceDate: string;
  description: string;
  technician: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedClientId?: number | null;
}

/** User profile used to resolve email addresses for alerts. */
export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
}

/**
 * Ask fire-extinguisher-service to recalculate all extinguisher statuses
 * based on expiration dates. Called at the start of every cron run.
 */
export async function refreshExtinguisherStatuses(): Promise<void> {
  try {
    await axios.post(`${FIRE_EXTINGUISHER_URL}/internal/refresh-statuses`);
    console.log('[HTTP] Extinguisher statuses refreshed via fire-extinguisher-service');
  } catch (error) {
    console.warn('[HTTP] Could not refresh extinguisher statuses — service may be offline');
  }
}

/**
 * Fetch extinguishers expiring within N days (default 30).
 * Used for the primary expiry alert cron check.
 */
export async function fetchExpiringExtinguishers(days = 30): Promise<FireExtinguisherRecord[]> {
  try {
    const response = await axios.get(`${FIRE_EXTINGUISHER_URL}/internal/expiring`, {
      params: { days },
    });
    return response.data;
  } catch {
    console.warn(`[HTTP] Could not fetch extinguishers expiring in ${days} days`);
    return [];
  }
}

/** Fetch all extinguishers already marked EXPIRED. */
export async function fetchExpiredExtinguishers(): Promise<FireExtinguisherRecord[]> {
  try {
    const response = await axios.get(`${FIRE_EXTINGUISHER_URL}/internal/expired`);
    return response.data;
  } catch {
    console.warn('[HTTP] Could not fetch expired extinguishers');
    return [];
  }
}

/** Fetch inspections whose nextInspectionDate is due (today or overdue). */
export async function fetchDueInspections(): Promise<InspectionDueRecord[]> {
  try {
    const response = await axios.get(`${INSPECTION_URL}/internal/due`);
    return response.data;
  } catch {
    console.warn('[HTTP] Could not fetch due inspections');
    return [];
  }
}

/** Fetch scheduled/in-progress maintenance records needing reminders. */
export async function fetchMaintenanceReminders(): Promise<MaintenanceReminderRecord[]> {
  try {
    const response = await axios.get(`${MAINTENANCE_URL}/internal/reminders`);
    return response.data;
  } catch {
    console.warn('[HTTP] Could not fetch maintenance reminders');
    return [];
  }
}

/**
 * Resolve a user's email and display name from user-service.
 * Returns null when user not found or service offline.
 */
export async function fetchUserProfile(userId: number): Promise<UserProfile | null> {
  try {
    const response = await axios.get(`${USER_URL}/internal/users/${userId}`);
    return response.data;
  } catch {
    console.warn(`[HTTP] Could not fetch user profile for userId=${userId}`);
    return null;
  }
}

/** Format a user's full name from profile fields. */
export function formatUserName(user: UserProfile): string {
  return `${user.firstName} ${user.lastName}`.trim();
}
