/**
 * Maintenance REST Route Definitions
 *
 * RBAC:
 *   - CLIENT:    read-only list/history for assigned extinguishers
 *   - INSPECTOR: create, complete, read (field technicians)
 *   - ADMIN:     full CRUD
 */
import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validate.middleware';
import {
  createMaintenanceSchema,
  updateMaintenanceSchema,
  completeMaintenanceSchema,
  maintenanceIdParamSchema,
  extinguisherCodeParamSchema,
} from '../dto/maintenance.dto';
import {
  createHandler,
  listHandler,
  getByIdHandler,
  historyHandler,
  updateHandler,
  completeHandler,
  deleteHandler,
} from '../controllers/maintenance.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRole('ADMIN', 'INSPECTOR', 'CLIENT'), listHandler);

router.get(
  '/history/:extinguisherCode',
  requireRole('ADMIN', 'INSPECTOR', 'CLIENT'),
  validateParams(extinguisherCodeParamSchema),
  historyHandler
);

router.post('/', requireRole('ADMIN', 'INSPECTOR'), validateBody(createMaintenanceSchema), createHandler);

router.post(
  '/:id/complete',
  requireRole('ADMIN', 'INSPECTOR'),
  validateParams(maintenanceIdParamSchema),
  validateBody(completeMaintenanceSchema),
  completeHandler
);

router.get('/:id', requireRole('ADMIN', 'INSPECTOR', 'CLIENT'), validateParams(maintenanceIdParamSchema), getByIdHandler);

router.patch(
  '/:id',
  requireRole('ADMIN', 'INSPECTOR'),
  validateParams(maintenanceIdParamSchema),
  validateBody(updateMaintenanceSchema),
  updateHandler
);

router.delete('/:id', requireRole('ADMIN'), validateParams(maintenanceIdParamSchema), deleteHandler);

export default router;
