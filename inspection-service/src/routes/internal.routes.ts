/**
 * Internal (service-to-service) Routes — Inspection Service
 *
 * WHAT: Unauthenticated endpoints for notification cron and reporting aggregator.
 * WHY:  Other microservices need due-inspection data without end-user JWT tokens.
 * NOTE: In production, restrict these to private network / API gateway only.
 */
import { Router } from 'express';
import {
  dueHandler,
  allHandler,
  statsHandler,
} from '../controllers/internal.controller';

const router = Router();

/**
 * @swagger
 * /internal/due:
 *   get:
 *     summary: Inspections with nextInspectionDate today or overdue (cron)
 *     tags: [Internal]
 *     responses:
 *       200:
 *         description: Due inspection records
 */
router.get('/due', dueHandler);

/**
 * @swagger
 * /internal/all:
 *   get:
 *     summary: All inspection records for PDF reports
 *     tags: [Internal]
 *     responses:
 *       200:
 *         description: Full inspection list
 */
router.get('/all', allHandler);

/**
 * @swagger
 * /internal/stats:
 *   get:
 *     summary: Aggregate inspection counts for dashboard statistics
 *     tags: [Internal]
 *     responses:
 *       200:
 *         description: total and dueThisMonth counts
 */
router.get('/stats', statsHandler);

export default router;
