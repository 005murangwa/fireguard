/**
 * =============================================================================
 * FireGuard LTD — Notification HTTP Controllers
 * =============================================================================
 * Thin request/response handlers — validation + status codes only.
 * All business logic lives in notification.service.ts.
 * =============================================================================
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import {
  listNotifications,
  markNotificationRead,
  getNotificationStats,
  runDailyNotificationCron,
  sendInternalNotification,
} from '../services/notification.service';
import { getConnectedUserCount } from '../services/websocket.service';

/** Zod schema for POST /notifications/internal/send body. */
const sendNotificationSchema = z.object({
  userId: z.number().int().positive(),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  notificationType: z.string().optional(),
  sendEmail: z.boolean().optional(),
  extinguisherCode: z.string().optional(),
  alertType: z.string().optional(),
});

/**
 * GET /notifications
 * CLIENT → own notifications only; ADMIN → all notifications.
 */
export async function list(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.role === 'CLIENT' ? req.user.userId : undefined;
    const notifications = await listNotifications(userId);
    res.json(notifications);
  } catch {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

/**
 * PATCH /notifications/:id/read
 * Mark a notification as read. Clients restricted to their own records.
 */
export async function markRead(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid notification ID' });
      return;
    }

    const requestingUserId = req.user?.role === 'CLIENT' ? req.user.userId : undefined;
    const notification = await markNotificationRead(id, requestingUserId);
    res.json(notification);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark notification as read';
    const status = message === 'Notification not found' ? 404 : message === 'Access denied' ? 403 : 400;
    res.status(status).json({ error: message });
  }
}

/**
 * GET /notifications/stats
 * ADMIN only — aggregate counts for dashboard widgets.
 */
export async function stats(req: Request, res: Response): Promise<void> {
  try {
    const data = await getNotificationStats();
    res.json({
      ...data,
      websocketConnectedUsers: getConnectedUserCount(),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch notification statistics' });
  }
}

/**
 * POST /notifications/run-cron
 * ADMIN only — manually trigger the daily cron pipeline for testing/demo.
 */
export async function runCron(req: Request, res: Response): Promise<void> {
  try {
    const result = await runDailyNotificationCron();
    res.json({ message: 'Cron job completed', result });
  } catch {
    res.status(500).json({ error: 'Cron job failed' });
  }
}

/**
 * GET /notifications/internal/stats
 * Internal stats for reporting-service aggregation (no JWT).
 */
export async function internalStats(_req: Request, res: Response): Promise<void> {
  try {
    const data = await getNotificationStats();
    res.json({ total: data.total, unread: data.unread });
  } catch {
    res.status(500).json({ error: 'Failed to fetch internal stats' });
  }
}

/**
 * POST /notifications/internal/send
 * Internal service-to-service endpoint (no JWT required).
 * Other microservices use this to push dashboard notifications to users.
 */
export async function sendInternal(req: Request, res: Response): Promise<void> {
  try {
    const parsed = sendNotificationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
      return;
    }

    const result = await sendInternalNotification(parsed.data);
    res.status(201).json({ message: 'Notification sent', ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send notification';
    res.status(400).json({ error: message });
  }
}
