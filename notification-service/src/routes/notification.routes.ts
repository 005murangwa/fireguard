/**
 * =============================================================================
 * FireGuard LTD — Notification REST Routes
 * =============================================================================
 * Endpoint map:
 *   GET    /notifications              — list (auth)
 *   PATCH  /notifications/:id/read     — mark read (auth)
 *   GET    /notifications/stats        — stats (admin)
 *   POST   /notifications/run-cron     — manual cron (admin)
 *   POST   /notifications/internal/send — internal send (no auth)
 * =============================================================================
 */

import { Router } from 'express';
import {
  list,
  markRead,
  stats,
  runCron,
  sendInternal,
  internalStats,
} from '../controllers/notification.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Internal service-to-service — no JWT (call only from trusted network)
router.get('/internal/stats', internalStats);
router.post('/internal/send', sendInternal);

// Admin-only maintenance endpoints
router.post('/run-cron', authMiddleware, requireRole('ADMIN'), runCron);
router.get('/stats', authMiddleware, requireRole('ADMIN'), stats);

// Authenticated user endpoints
router.get('/', authMiddleware, list);
router.patch('/:id/read', authMiddleware, markRead);

export default router;
