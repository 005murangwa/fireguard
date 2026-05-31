/**
 * =============================================================================
 * FireGuard LTD — Report REST Routes (ADMIN only)
 * =============================================================================
 * All routes require JWT authentication with ADMIN role.
 * Each endpoint returns a downloadable PDF file.
 * =============================================================================
 */

import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.middleware';
import {
  expiredReport,
  upcomingExpirationsReport,
  inspectionReport,
  maintenanceReport,
  statisticsReport,
} from '../controllers/report.controller';

const router = Router();

// Every report route is ADMIN-only
router.use(authMiddleware, requireAdmin);

/**
 * @swagger
 * /reports/expired:
 *   get:
 *     summary: Download expired extinguishers PDF report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Authentication required
 *       403:
 *         description: ADMIN role required
 */
router.get('/expired', expiredReport);

/**
 * @swagger
 * /reports/upcoming-expirations:
 *   get:
 *     summary: Download upcoming expirations (30 days) PDF report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/upcoming-expirations', upcomingExpirationsReport);

/**
 * @swagger
 * /reports/inspections:
 *   get:
 *     summary: Download inspection history PDF report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/inspections', inspectionReport);

/**
 * @swagger
 * /reports/maintenance:
 *   get:
 *     summary: Download maintenance history PDF report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/maintenance', maintenanceReport);

/**
 * @swagger
 * /reports/statistics:
 *   get:
 *     summary: Download system statistics PDF report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/statistics', statisticsReport);

export default router;
