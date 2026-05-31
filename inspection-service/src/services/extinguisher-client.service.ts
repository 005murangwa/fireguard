/**
 * Fire Extinguisher Service HTTP Client — Inspection Service
 *
 * WHAT: Inter-service calls to fire-extinguisher-service internal API (port 5003).
 * WHY:  Verify extinguisher codes exist and push status updates after inspections.
 * NOTE: No JWT — internal routes are trusted on localhost / private network.
 */
import axios from 'axios';
import { ExtinguisherSyncStatus } from '../types';

const SERVICE_NAME = 'inspection-service';

function getBaseUrl(): string {
  return process.env.FIRE_EXTINGUISHER_SERVICE_URL || 'http://localhost:5003';
}

/**
 * Confirms the extinguisher code exists before creating an inspection record.
 *
 * @param code - Business extinguisher code (e.g. FE-2024-001)
 * @returns true when found, false when 404
 */
export async function verifyExtinguisherExists(code: string): Promise<boolean> {
  try {
    await axios.get(`${getBaseUrl()}/internal/extinguishers/${encodeURIComponent(code)}`, {
      timeout: 5000,
    });
    return true;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return false;
    }
    console.error(`[${SERVICE_NAME}] fire-extinguisher lookup failed:`, error);
    throw new Error('Unable to reach fire-extinguisher-service');
  }
}

/**
 * PATCH extinguisher status after inspection create/update.
 *
 * @param code - Extinguisher business code
 * @param status - Target status (ACTIVE, INSPECTION_DUE, UNDER_MAINTENANCE)
 */
export async function syncExtinguisherStatus(
  code: string,
  status: ExtinguisherSyncStatus
): Promise<void> {
  try {
    await axios.patch(
      `${getBaseUrl()}/internal/extinguishers/${encodeURIComponent(code)}/status`,
      { status, source: SERVICE_NAME },
      { timeout: 5000 }
    );
    console.log(`[${SERVICE_NAME}] Synced ${code} → ${status}`);
  } catch (error) {
    // Log but do not fail the inspection write — status sync is best-effort
    console.error(`[${SERVICE_NAME}] Status sync failed for ${code}:`, error);
  }
}

/** Fetch extinguisher codes assigned to a CLIENT (via internal API). */
export async function getClientExtinguisherCodes(clientId: number): Promise<string[]> {
  try {
    const res = await axios.get<string[]>(
      `${getBaseUrl()}/internal/clients/${clientId}/extinguisher-codes`,
      { timeout: 5000 }
    );
    return res.data;
  } catch (error) {
    console.error(`[${SERVICE_NAME}] client codes lookup failed:`, error);
    return [];
  }
}
