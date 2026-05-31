/**
 * Maintenance → Extinguisher Status Mapping
 *
 * WHAT: Maps maintenance work order status to extinguisher inventory status.
 * WHY:  Scheduling maintenance sets UNDER_MAINTENANCE; completion restores ACTIVE.
 */
import { ExtinguisherSyncStatus, MaintenanceStatus } from '../types';

/**
 * Determines whether and how to update extinguisher status after maintenance changes.
 *
 * @param status - Current maintenance record status
 * @returns Target extinguisher status, or null if no sync required
 */
export function resolveExtinguisherStatusFromMaintenance(
  status: MaintenanceStatus
): ExtinguisherSyncStatus | null {
  switch (status) {
    case 'SCHEDULED':
    case 'IN_PROGRESS':
      return 'UNDER_MAINTENANCE';
    case 'COMPLETED':
    case 'CANCELLED':
      return 'ACTIVE';
    default:
      return null;
  }
}
