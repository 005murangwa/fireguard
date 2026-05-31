/**
 * =============================================================================
 * FireGuard LTD — Report HTTP Controllers
 * =============================================================================
 * Each handler fetches aggregated data, generates a PDF buffer, and streams
 * it back as application/pdf with a descriptive Content-Disposition filename.
 * =============================================================================
 */

import { Request, Response } from 'express';
import {
  fetchExpiredExtinguishers,
  fetchUpcomingExpirations,
  fetchAllInspections,
  fetchAllMaintenance,
  fetchSystemStatistics,
} from '../services/data-aggregator.service';
import {
  generateExpiredExtinguishersPdf,
  generateUpcomingExpirationsPdf,
  generateInspectionReportPdf,
  generateMaintenanceReportPdf,
  generateSystemStatisticsPdf,
} from '../services/pdf.service';

/** Helper — send PDF buffer as downloadable attachment. */
function sendPdf(res: Response, buffer: Buffer, filename: string): void {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);
  res.send(buffer);
}

/** GET /reports/expired — PDF of all expired extinguishers. */
export async function expiredReport(_req: Request, res: Response): Promise<void> {
  try {
    const data = await fetchExpiredExtinguishers();
    const pdf = await generateExpiredExtinguishersPdf(data);
    sendPdf(res, pdf, `fireguard-expired-extinguishers-${Date.now()}.pdf`);
  } catch {
    res.status(500).json({ error: 'Failed to generate expired extinguishers report' });
  }
}

/** GET /reports/upcoming-expirations — PDF of 30-day upcoming expirations. */
export async function upcomingExpirationsReport(_req: Request, res: Response): Promise<void> {
  try {
    const data = await fetchUpcomingExpirations(30);
    const pdf = await generateUpcomingExpirationsPdf(data);
    sendPdf(res, pdf, `fireguard-upcoming-expirations-${Date.now()}.pdf`);
  } catch {
    res.status(500).json({ error: 'Failed to generate upcoming expirations report' });
  }
}

/** GET /reports/inspections — PDF inspection history report. */
export async function inspectionReport(_req: Request, res: Response): Promise<void> {
  try {
    const data = await fetchAllInspections();
    const pdf = await generateInspectionReportPdf(data);
    sendPdf(res, pdf, `fireguard-inspection-report-${Date.now()}.pdf`);
  } catch {
    res.status(500).json({ error: 'Failed to generate inspection report' });
  }
}

/** GET /reports/maintenance — PDF maintenance history report. */
export async function maintenanceReport(_req: Request, res: Response): Promise<void> {
  try {
    const data = await fetchAllMaintenance();
    const pdf = await generateMaintenanceReportPdf(data);
    sendPdf(res, pdf, `fireguard-maintenance-report-${Date.now()}.pdf`);
  } catch {
    res.status(500).json({ error: 'Failed to generate maintenance report' });
  }
}

/** GET /reports/statistics — PDF system statistics summary. */
export async function statisticsReport(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await fetchSystemStatistics();
    const pdf = await generateSystemStatisticsPdf(stats);
    sendPdf(res, pdf, `fireguard-system-statistics-${Date.now()}.pdf`);
  } catch {
    res.status(500).json({ error: 'Failed to generate system statistics report' });
  }
}
