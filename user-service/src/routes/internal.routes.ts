/**
 * =============================================================================
 * FireGuard LTD — Internal (Service-to-Service) Routes — User Service
 * =============================================================================
 * WHAT: Unauthenticated endpoints for notification email resolution and
 *       reporting-service statistics aggregation.
 * WHY:  Cron jobs and PDF reports need user profiles without admin JWT tokens.
 * NOTE: Restrict to private network in production deployments.
 * =============================================================================
 */

import { Router } from 'express';
import { internalGetUserHandler, internalStatsHandler } from '../controllers/internal.controller';

const router = Router();

/**
 * @swagger
 * /internal/users/{id}:
 *   get:
 *     summary: Lookup user profile by ID (inter-service)
 *     tags: [Internal]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User profile with email for notification delivery
 *       404:
 *         description: User not found
 */
router.get('/users/:id', internalGetUserHandler);

/**
 * @swagger
 * /internal/stats:
 *   get:
 *     summary: Aggregate user counts for reporting dashboard
 *     tags: [Internal]
 *     responses:
 *       200:
 *         description: total, admins, clients, inspectors counts
 */
router.get('/stats', internalStatsHandler);

export default router;
