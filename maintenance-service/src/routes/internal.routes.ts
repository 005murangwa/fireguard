/**
 * Internal (service-to-service) Routes — Maintenance Service
 *
 * WHAT: Unauthenticated endpoints for notification reminders and reporting.
 * WHY:  Cron jobs and PDF reports pull maintenance data without user JWTs.
 */
import { Router } from 'express';
import {
  remindersHandler,
  allHandler,
  statsHandler,
} from '../controllers/internal.controller';

const router = Router();

/**
 * @swagger
 * /internal/reminders:
 *   get:
 *     summary: Scheduled/in-progress maintenance needing reminders
 *     tags: [Internal]
 *     responses:
 *       200:
 *         description: Active maintenance work orders
 */
router.get('/reminders', remindersHandler);

/**
 * @swagger
 * /internal/all:
 *   get:
 *     summary: All maintenance records for PDF reports
 *     tags: [Internal]
 *     responses:
 *       200:
 *         description: Full maintenance list
 */
router.get('/all', allHandler);

/**
 * @swagger
 * /internal/stats:
 *   get:
 *     summary: Aggregate maintenance counts for dashboard statistics
 *     tags: [Internal]
 *     responses:
 *       200:
 *         description: total, scheduled, completed counts
 */
router.get('/stats', statsHandler);

export default router;
