/**
 * Internal HTTP Controllers — Maintenance Service
 */
import { Request, Response } from 'express';
import {
  getMaintenanceReminders,
  getAllMaintenanceForReport,
  getMaintenanceReportStats,
} from '../services/maintenance.service';

/** GET /internal/reminders — notification cron pulls upcoming work */
export async function remindersHandler(_req: Request, res: Response): Promise<void> {
  try {
    const records = await getMaintenanceReminders();
    res.json(records);
  } catch {
    res.status(500).json({ error: 'Failed to fetch reminders', code: 'REMINDERS_FAILED' });
  }
}

/** GET /internal/all — reporting-service maintenance PDF */
export async function allHandler(_req: Request, res: Response): Promise<void> {
  try {
    const records = await getAllMaintenanceForReport();
    res.json(records);
  } catch {
    res.status(500).json({ error: 'Failed to fetch maintenance records', code: 'ALL_FAILED' });
  }
}

/** GET /internal/stats — reporting-service statistics bundle */
export async function statsHandler(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await getMaintenanceReportStats();
    res.json(stats);
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats', code: 'STATS_FAILED' });
  }
}
