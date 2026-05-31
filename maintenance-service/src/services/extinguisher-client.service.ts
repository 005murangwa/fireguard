/**
 * Fire Extinguisher Service HTTP Client — Maintenance Service
 *
 * WHAT: Inter-service calls to fire-extinguisher-service internal API (port 5003).
 * WHY:  Verify codes and set UNDER_MAINTENANCE when maintenance is scheduled.
 */
import axios from 'axios';
import { ExtinguisherSyncStatus } from '../types';

const SERVICE_NAME = 'maintenance-service';

function getBaseUrl(): string {
  return process.env.FIRE_EXTINGUISHER_SERVICE_URL || 'http://localhost:5003';
}

/** Returns true when extinguisher code exists in inventory. */
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

/** PATCH extinguisher status after maintenance create/update/complete. */
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
    console.error(`[${SERVICE_NAME}] Status sync failed for ${code}:`, error);
  }
}

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
