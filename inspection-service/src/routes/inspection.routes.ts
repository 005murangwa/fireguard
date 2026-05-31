/**
 * Inspection REST Route Definitions
 *
 * WHAT: Express router wiring JWT auth, Zod validation, and controllers.
 * RBAC:
 *   - INSPECTOR: create; read/update own records; read history by extinguisherCode
 *   - ADMIN:     full CRUD on all records
 */
import { Router } from 'express';
import {
  authMiddleware,
  requireRole,
  requireOwnInspectionOrAdmin,
} from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validate.middleware';
import {
  createInspectionSchema,
  updateInspectionSchema,
  inspectionIdParamSchema,
  extinguisherCodeParamSchema,
} from '../dto/inspection.dto';
import {
  createHandler,
  listHandler,
  getByIdHandler,
  historyHandler,
  updateHandler,
  deleteHandler,
} from '../controllers/inspection.controller';

const router = Router();

// All inspection routes require a valid JWT
router.use(authMiddleware);

/**
 * @swagger
 * /inspections:
 *   post:
 *     summary: Create a new field inspection
 *     description: INSPECTOR creates with own userId as inspectorId; ADMIN may also create.
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInspection'
 *     responses:
 *       201:
 *         description: Inspection created
 *       404:
 *         description: Extinguisher not found
 */
router.post(
  '/',
  requireRole('ADMIN', 'INSPECTOR'),
  validateBody(createInspectionSchema),
  createHandler
);

/**
 * @swagger
 * /inspections:
 *   get:
 *     summary: List inspections
 *     description: ADMIN sees all records; INSPECTOR sees only own records.
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of inspection records
 */
router.get('/', requireRole('ADMIN', 'INSPECTOR', 'CLIENT'), listHandler);

/**
 * @swagger
 * /inspections/history/{extinguisherCode}:
 *   get:
 *     summary: Inspection history for one extinguisher
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: extinguisherCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Newest-first inspection timeline
 */
router.get(
  '/history/:extinguisherCode',
  requireRole('ADMIN', 'INSPECTOR', 'CLIENT'),
  validateParams(extinguisherCodeParamSchema),
  historyHandler
);

/**
 * @swagger
 * /inspections/{id}:
 *   get:
 *     summary: Get inspection by ID
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inspection record
 *       403:
 *         description: INSPECTOR cannot access another inspector's record
 */
router.get(
  '/:id',
  requireRole('ADMIN', 'INSPECTOR'),
  validateParams(inspectionIdParamSchema),
  requireOwnInspectionOrAdmin,
  getByIdHandler
);

/**
 * @swagger
 * /inspections/{id}:
 *   patch:
 *     summary: Update an inspection
 *     description: Triggers extinguisher status sync on fire-extinguisher-service.
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateInspection'
 *     responses:
 *       200:
 *         description: Updated inspection
 */
router.patch(
  '/:id',
  requireRole('ADMIN', 'INSPECTOR'),
  validateParams(inspectionIdParamSchema),
  requireOwnInspectionOrAdmin,
  validateBody(updateInspectionSchema),
  updateHandler
);

/**
 * @swagger
 * /inspections/{id}:
 *   delete:
 *     summary: Delete an inspection (ADMIN only)
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Deleted
 */
router.delete(
  '/:id',
  requireRole('ADMIN'),
  validateParams(inspectionIdParamSchema),
  deleteHandler
);

export default router;
