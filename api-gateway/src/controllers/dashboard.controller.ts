/**
 * Aggregated dashboard statistics for Admin Dashboard.
 * Uses internal service endpoints where public routes would conflict (e.g. /extinguishers/stats → :id).
 */
import { Request, Response } from 'express';
import axios from 'axios';

const USER = process.env.USER_SERVICE_URL || 'http://localhost:5002';
const EXT = process.env.FIRE_EXTINGUISHER_SERVICE_URL || 'http://localhost:5003';
const NOTIFY = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5006';

function headers(req: Request) {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (req.headers.authorization) h.Authorization = req.headers.authorization;
  return h;
}

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const h = headers(req);

    const [users, ext, notif, expiring] = await Promise.all([
      axios.get(`${USER}/users/stats`, { headers: h }),
      axios.get(`${EXT}/internal/stats`, { headers: h }),
      axios.get(`${NOTIFY}/notifications/stats`, { headers: h }),
      axios.get(`${EXT}/internal/expiring?days=30`, { headers: h }),
    ]);

    res.json({
      totalUsers: users.data.total ?? 0,
      totalExtinguishers: ext.data.total ?? 0,
      activeExtinguishers: ext.data.active ?? 0,
      expiredExtinguishers: ext.data.expired ?? 0,
      pendingInspections: ext.data.inspectionDue ?? 0,
      upcomingExpirations: Array.isArray(expiring.data) ? expiring.data.length : 0,
      notificationsSent: notif.data.total ?? 0,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}
