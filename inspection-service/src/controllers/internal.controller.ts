/**
 * Internal HTTP Controllers — Inspection Service
 *
 * WHAT: Handlers for inter-service calls (no JWT).
 * WHY:  notification-service cron and reporting-service aggregator consume these.
 */
import { Request, Response } from 'express';
import {
  getDueInspections,
  getAllInspectionsForReport,
  getInspectionStats,
} from '../services/inspection.service';

/** GET /internal/due — used by notification cron for due-date alerts */
export async function dueHandler(_req: Request, res: Response): Promise<void> {
  try {
    const records = await getDueInspections();
    res.json(records);
  } catch {
    res.status(500).json({ error: 'Failed to fetch due inspections', code: 'DUE_FAILED' });
  }
}

/** GET /internal/all — used by reporting-service PDF generator */
export async function allHandler(_req: Request, res: Response): Promise<void> {
  try {
    const records = await getAllInspectionsForReport();
    res.json(records);
  } catch {
    res.status(500).json({ error: 'Failed to fetch inspections', code: 'ALL_FAILED' });
  }
}

/** GET /internal/stats — used by reporting-service statistics report */
export async function statsHandler(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await getInspectionStats();
    res.json(stats);
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats', code: 'STATS_FAILED' });
  }
}
