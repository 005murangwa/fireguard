/**
 * =============================================================================
 * FireGuard LTD - Fire Extinguisher Route Definitions
 * =============================================================================
 * ROLE MATRIX:
 *   ADMIN     → POST, GET, PATCH, DELETE /extinguishers, GET /scan/:code
 *   INSPECTOR → GET /extinguishers, GET /extinguishers/:id, GET /scan/:code
 *   CLIENT    → GET /extinguishers, GET /extinguishers/:id, GET /scan/:code
 * =============================================================================
 */

import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.middleware';
import {
  createExtinguisherSchema,
  updateExtinguisherSchema,
  listExtinguishersQuerySchema,
  extinguisherIdParamSchema,
  scanCodeParamSchema,
} from '../validators/extinguisher.validator';
import {
  createHandler,
  listHandler,
  getByIdHandler,
  updateHandler,
  deleteHandler,
  scanHandler,
} from '../controllers/extinguisher.controller';

const router = Router();

// All routes require valid JWT
router.use(authMiddleware);

/**
 * @swagger
 * /scan/{code}:
 *   get:
 *     summary: Scan QR code lookup by extinguisher code
 *     tags: [Scan]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/scan/:code',
  requireRole('ADMIN', 'INSPECTOR', 'CLIENT'),
  validateParams(scanCodeParamSchema),
  scanHandler
);

/**
 * @swagger
 * /extinguishers:
 *   get:
 *     summary: List extinguishers with search, filter, pagination
 *     tags: [Extinguishers]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/extinguishers',
  requireRole('ADMIN', 'INSPECTOR', 'CLIENT'),
  validateQuery(listExtinguishersQuerySchema),
  listHandler
);

/**
 * @swagger
 * /extinguishers:
 *   post:
 *     summary: Create extinguisher with QR code (ADMIN only)
 *     tags: [Extinguishers]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/extinguishers',
  requireRole('ADMIN'),
  validateBody(createExtinguisherSchema),
  createHandler
);

/**
 * @swagger
 * /extinguishers/{id}:
 *   get:
 *     summary: Get extinguisher by ID
 *     tags: [Extinguishers]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/extinguishers/:id',
  requireRole('ADMIN', 'INSPECTOR', 'CLIENT'),
  validateParams(extinguisherIdParamSchema),
  getByIdHandler
);

/**
 * @swagger
 * /extinguishers/{id}:
 *   patch:
 *     summary: Update extinguisher (ADMIN only)
 *     tags: [Extinguishers]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/extinguishers/:id',
  requireRole('ADMIN'),
  validateParams(extinguisherIdParamSchema),
  validateBody(updateExtinguisherSchema),
  updateHandler
);

/**
 * @swagger
 * /extinguishers/{id}:
 *   delete:
 *     summary: Delete extinguisher (ADMIN only)
 *     tags: [Extinguishers]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/extinguishers/:id',
  requireRole('ADMIN'),
  validateParams(extinguisherIdParamSchema),
  deleteHandler
);

export default router;
