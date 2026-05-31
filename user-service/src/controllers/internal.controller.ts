/**
 * =============================================================================
 * FireGuard LTD — Internal HTTP Controllers — User Service
 * =============================================================================
 * WHAT: Handlers for service-to-service user lookup and stats endpoints.
 * WHY:  notification-service cron needs email addresses; reporting-service
 *       needs user counts for the system statistics PDF report.
 * =============================================================================
 */

import { Request, Response } from 'express';
import { getUserById, getUserStats } from '../services/user.service';

/**
 * GET /internal/users/:id
 * Returns public user profile (no password) for notification email resolution.
 */
export async function internalGetUserHandler(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const user = await getUserById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}

/**
 * GET /internal/stats
 * Returns role breakdown consumed by reporting-service data aggregator.
 */
export async function internalStatsHandler(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await getUserStats();
    res.json({
      total: stats.total,
      admins: stats.admins,
      clients: stats.clients,
      inspectors: stats.inspectors,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
}
