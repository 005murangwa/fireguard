/**
 * Inspection → Extinguisher Status Mapping
 *
 * WHAT: Derives fire-extinguisher status from inspection condition and due dates.
 * WHY:  After create/update, inspection-service syncs status via internal HTTP API.
 * HOW:  Returns null when no status change is needed (avoids unnecessary PATCH calls).
 */
import { ExtinguisherSyncStatus } from '../types';

/** Known condition values recorded by field inspectors. */
const MAINTENANCE_CONDITIONS = new Set(['FAILED', 'REQUIRES_MAINTENANCE']);
const ATTENTION_CONDITIONS = new Set(['POOR', 'FAIR']);

/**
 * Maps inspection outcome to extinguisher status for fire-extinguisher-service.
 *
 * Rules:
 * - FAILED / REQUIRES_MAINTENANCE → UNDER_MAINTENANCE
 * - Overdue nextInspectionDate or POOR/FAIR condition → INSPECTION_DUE
 * - Otherwise → ACTIVE (unit passed inspection)
 *
 * @param condition - Observed physical condition from inspection form
 * @param nextInspectionDate - Scheduled date for next mandatory inspection
 */
export function resolveStatusFromInspection(
  condition: string,
  nextInspectionDate: Date
): ExtinguisherSyncStatus | null {
  const normalized = condition.toUpperCase();

  if (MAINTENANCE_CONDITIONS.has(normalized)) {
    return 'UNDER_MAINTENANCE';
  }

  const now = new Date();
  if (nextInspectionDate <= now || ATTENTION_CONDITIONS.has(normalized)) {
    return 'INSPECTION_DUE';
  }

  return 'ACTIVE';
}
