/**
 * =============================================================================
 * FireGuard LTD - User Service Route Definitions
 * =============================================================================
 * WHAT: Express router wiring endpoints to controllers + middleware chain.
 * WHY:  All routes require JWT auth AND ADMIN role per business requirements.
 * =============================================================================
 */

import { Router } from 'express';
import { Role } from '@prisma/client';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.middleware';
import {
  listUsersQuerySchema,
  updateUserSchema,
  assignRoleSchema,
  userIdParamSchema,
} from '../validators/user.validator';
import {
  listUsersHandler,
  getStatsHandler,
  getUserHandler,
  updateUserHandler,
  deleteUserHandler,
  assignRoleHandler,
} from '../controllers/user.controller';

const router = Router();

// Every route in this service is admin-only — apply auth + role guard globally
router.use(authMiddleware);
router.use(requireRole(Role.ADMIN));

/**
 * @swagger
 * /users/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregate user counts
 */
router.get('/users/stats', getStatsHandler);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all users with pagination
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/users', validateQuery(listUsersQuerySchema), listUsersHandler);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/users/:id', validateParams(userIdParamSchema), getUserHandler);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/users/:id',
  validateParams(userIdParamSchema),
  validateBody(updateUserSchema),
  updateUserHandler
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/users/:id', validateParams(userIdParamSchema), deleteUserHandler);

/**
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     summary: Assign role to user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/users/:id/role',
  validateParams(userIdParamSchema),
  validateBody(assignRoleSchema),
  assignRoleHandler
);

export default router;
