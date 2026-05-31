/**
 * =============================================================================
 * FireGuard LTD — Notification Business Logic
 * =============================================================================
 * Core service layer: CRUD for dashboard notifications, deduplication,
 * email dispatch, WebSocket broadcast, and the daily cron orchestration.
 * =============================================================================
 */

import prisma from '../lib/prisma';
import {
  sendEmail,
  buildAlertEmailHtml,
  buildAlertEmailSubject,
} from './email.service';
import { broadcastToUser } from './websocket.service';
import {
  refreshExtinguisherStatuses,
  fetchExpiringExtinguishers,
  fetchExpiredExtinguishers,
  fetchDueInspections,
  fetchMaintenanceReminders,
  fetchUserProfile,
  formatUserName,
  FireExtinguisherRecord,
  InspectionDueRecord,
  MaintenanceReminderRecord,
} from './http-clients.service';

/** Alert type constants stored in notificationType / NotificationDedup.alertType. */
export const AlertType = {
  EXPIRY_30_DAYS: 'EXPIRY_30_DAYS',
  EXPIRED: 'EXPIRED',
  INSPECTION_DUE: 'INSPECTION_DUE',
  MAINTENANCE_REMINDER: 'MAINTENANCE_REMINDER',
  GENERAL: 'GENERAL',
} as const;

export type AlertTypeValue = (typeof AlertType)[keyof typeof AlertType];

/** Result summary returned after a cron run completes. */
export interface CronRunResult {
  processed: number;
  sent: number;
  skippedDuplicates: number;
  errors: number;
  details: {
    expiry30Days: number;
    expired: number;
    inspectionDue: number;
    maintenanceReminders: number;
  };
}

/** Input for creating a notification programmatically (internal send endpoint). */
export interface SendNotificationInput {
  userId: number;
  title: string;
  message: string;
  notificationType?: string;
  sendEmail?: boolean;
  extinguisherCode?: string;
  alertType?: string;
}

/**
 * Check whether this alert was already sent using the dedup ledger.
 * Returns true when a duplicate exists (should skip sending).
 */
async function isDuplicateAlert(
  userId: number,
  extinguisherCode: string,
  alertType: string
): Promise<boolean> {
  const existing = await prisma.notificationDedup.findUnique({
    where: {
      notification_dedup_unique: { userId, extinguisherCode, alertType },
    },
  });
  return existing !== null;
}

/**
 * Record a sent alert in the dedup table so cron won't repeat it.
 */
async function recordDedup(
  userId: number,
  extinguisherCode: string,
  alertType: string
): Promise<void> {
  await prisma.notificationDedup.create({
    data: { userId, extinguisherCode, alertType },
  });
}

/**
 * Persist notification, optionally send email, and push via WebSocket.
 * This is the single entry point for all outbound notifications.
 */
export async function createAndDeliverNotification(
  input: SendNotificationInput
): Promise<{ id: number }> {
  const notificationType = input.notificationType || AlertType.GENERAL;

  // 1. Save to database for dashboard history
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      notificationType,
      isRead: false,
    },
  });

  // 2. Send email when requested (cron alerts always send email)
  if (input.sendEmail) {
    const user = await fetchUserProfile(input.userId);
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: input.title,
        html: `<div style="font-family:Arial,sans-serif"><h2>${input.title}</h2><p>${input.message}</p></div>`,
      });
    }
  }

  // 3. Push real-time update to connected WebSocket clients
  broadcastToUser(input.userId, {
    id: notification.id,
    userId: notification.userId,
    title: notification.title,
    message: notification.message,
    notificationType: notification.notificationType,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
  });

  // 4. Record dedup entry when extinguisher-specific alert
  if (input.extinguisherCode && input.alertType) {
    await recordDedup(input.userId, input.extinguisherCode, input.alertType);
  }

  return { id: notification.id };
}

/**
 * Process a single extinguisher expiry alert (30-day or expired).
 * Skips when duplicate, unassigned client, or delivery fails.
 */
async function processExtinguisherAlert(
  ext: FireExtinguisherRecord,
  alertType: AlertTypeValue,
  title: string,
  message: string
): Promise<'sent' | 'skipped' | 'error'> {
  const userId = ext.assignedClientId;
  if (!userId) {
    return 'skipped';
  }

  if (await isDuplicateAlert(userId, ext.extinguisherCode, alertType)) {
    return 'skipped';
  }

  const user = await fetchUserProfile(userId);
  const recipientName = user ? formatUserName(user) : 'Valued Customer';

  try {
    // Rich HTML email for extinguisher alerts
    if (user?.email) {
      const html = buildAlertEmailHtml({
        recipientName,
        extinguisherCode: ext.extinguisherCode,
        extinguisherType: ext.type,
        location: ext.installationLocation,
        expirationDate: new Date(ext.expirationDate).toLocaleDateString(),
        alertSummary: message,
      });

      await sendEmail({
        to: user.email,
        subject: buildAlertEmailSubject(title, ext.extinguisherCode),
        html,
      });
    }

    await createAndDeliverNotification({
      userId,
      title,
      message,
      notificationType: alertType,
      sendEmail: false, // email already sent above with rich template
      extinguisherCode: ext.extinguisherCode,
      alertType,
    });

    return 'sent';
  } catch (error) {
    console.error(`[Cron] Failed alert for ${ext.extinguisherCode}:`, error);
    return 'error';
  }
}

/** Process inspection due alert for a single record. */
async function processInspectionAlert(
  inspection: InspectionDueRecord
): Promise<'sent' | 'skipped' | 'error'> {
  const userId = inspection.assignedClientId;
  if (!userId) {
    return 'skipped';
  }

  const alertType = AlertType.INSPECTION_DUE;
  if (await isDuplicateAlert(userId, inspection.extinguisherCode, alertType)) {
    return 'skipped';
  }

  const title = 'Inspection Due';
  const message = `Fire extinguisher ${inspection.extinguisherCode} requires inspection by ${new Date(inspection.nextInspectionDate).toLocaleDateString()}.`;

  try {
    await createAndDeliverNotification({
      userId,
      title,
      message,
      notificationType: alertType,
      sendEmail: true,
      extinguisherCode: inspection.extinguisherCode,
      alertType,
    });
    return 'sent';
  } catch {
    return 'error';
  }
}

/** Process maintenance reminder for a single record. */
async function processMaintenanceAlert(
  record: MaintenanceReminderRecord
): Promise<'sent' | 'skipped' | 'error'> {
  const userId = record.assignedClientId;
  if (!userId) {
    return 'skipped';
  }

  const alertType = AlertType.MAINTENANCE_REMINDER;
  if (await isDuplicateAlert(userId, record.extinguisherCode, alertType)) {
    return 'skipped';
  }

  const title = 'Maintenance Reminder';
  const message = `Scheduled maintenance for extinguisher ${record.extinguisherCode} on ${new Date(record.maintenanceDate).toLocaleDateString()}: ${record.description}`;

  try {
    await createAndDeliverNotification({
      userId,
      title,
      message,
      notificationType: alertType,
      sendEmail: true,
      extinguisherCode: record.extinguisherCode,
      alertType,
    });
    return 'sent';
  } catch {
    return 'error';
  }
}

/**
 * Main cron orchestrator — called daily by node-cron and manually by admins.
 *
 * Steps:
 *  1. Refresh extinguisher statuses via fire-extinguisher-service HTTP API
 *  2. Check 30-day expirations
 *  3. Check already-expired extinguishers
 *  4. Check inspection due dates
 *  5. Check maintenance reminders
 */
export async function runDailyNotificationCron(): Promise<CronRunResult> {
  console.log('[Cron] Starting daily notification checks...');

  // Step 1 — sync statuses upstream before evaluating alerts
  await refreshExtinguisherStatuses();

  const result: CronRunResult = {
    processed: 0,
    sent: 0,
    skippedDuplicates: 0,
    errors: 0,
    details: {
      expiry30Days: 0,
      expired: 0,
      inspectionDue: 0,
      maintenanceReminders: 0,
    },
  };

  // Step 2 — 30-day expiry warnings
  const expiring30 = await fetchExpiringExtinguishers(30);
  for (const ext of expiring30) {
    result.processed++;
    const outcome = await processExtinguisherAlert(
      ext,
      AlertType.EXPIRY_30_DAYS,
      '30-Day Expiration Warning',
      `Your fire extinguisher ${ext.extinguisherCode} will expire in 30 days. Please schedule replacement or re-certification.`
    );
    if (outcome === 'sent') {
      result.sent++;
      result.details.expiry30Days++;
    } else if (outcome === 'skipped') {
      result.skippedDuplicates++;
    } else {
      result.errors++;
    }
  }

  // Step 3 — already expired extinguishers
  const expired = await fetchExpiredExtinguishers();
  for (const ext of expired) {
    result.processed++;
    const outcome = await processExtinguisherAlert(
      ext,
      AlertType.EXPIRED,
      'URGENT: Extinguisher Expired',
      `Fire extinguisher ${ext.extinguisherCode} has EXPIRED and must be replaced or serviced immediately.`
    );
    if (outcome === 'sent') {
      result.sent++;
      result.details.expired++;
    } else if (outcome === 'skipped') {
      result.skippedDuplicates++;
    } else {
      result.errors++;
    }
  }

  // Step 4 — inspection due alerts
  const dueInspections = await fetchDueInspections();
  for (const inspection of dueInspections) {
    result.processed++;
    const outcome = await processInspectionAlert(inspection);
    if (outcome === 'sent') {
      result.sent++;
      result.details.inspectionDue++;
    } else if (outcome === 'skipped') {
      result.skippedDuplicates++;
    } else {
      result.errors++;
    }
  }

  // Step 5 — maintenance reminders
  const maintenanceRecords = await fetchMaintenanceReminders();
  for (const record of maintenanceRecords) {
    result.processed++;
    const outcome = await processMaintenanceAlert(record);
    if (outcome === 'sent') {
      result.sent++;
      result.details.maintenanceReminders++;
    } else if (outcome === 'skipped') {
      result.skippedDuplicates++;
    } else {
      result.errors++;
    }
  }

  console.log('[Cron] Daily notification checks complete:', result);
  return result;
}

/** List notifications — clients see only their own; admins see all. */
export async function listNotifications(userId?: number) {
  return prisma.notification.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}

/** Mark a single notification as read. Clients may only mark their own. */
export async function markNotificationRead(id: number, requestingUserId?: number) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) {
    throw new Error('Notification not found');
  }

  if (requestingUserId && notification.userId !== requestingUserId) {
    throw new Error('Access denied');
  }

  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

/** Admin dashboard statistics for notification volume. */
export async function getNotificationStats() {
  const [total, unread, byType, dedupCount] = await Promise.all([
    prisma.notification.count(),
    prisma.notification.count({ where: { isRead: false } }),
    prisma.notification.groupBy({
      by: ['notificationType'],
      _count: { id: true },
    }),
    prisma.notificationDedup.count(),
  ]);

  return {
    total,
    unread,
    read: total - unread,
    dedupEntries: dedupCount,
    byType: byType.map((row) => ({
      notificationType: row.notificationType,
      count: row._count.id,
    })),
  };
}

/** Internal endpoint handler — other services call this to notify a user. */
export async function sendInternalNotification(input: SendNotificationInput) {
  return createAndDeliverNotification({
    ...input,
    notificationType: input.notificationType || AlertType.GENERAL,
    sendEmail: input.sendEmail ?? false,
  });
}
