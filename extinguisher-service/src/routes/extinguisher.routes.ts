import { Router } from 'express';
import {
  create,
  list,
  getById,
  update,
  remove,
  expiring,
  stats,
  monthlyExpirations,
} from '../controllers/extinguisher.controller';
import { validateBody } from '../middleware/validate.middleware';
import { createExtinguisherSchema, updateExtinguisherSchema } from '../dto/extinguisher.dto';
import { authMiddleware, requireRole, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/', optionalAuth, validateBody(createExtinguisherSchema), create);
router.get('/internal/:id', getById);
router.get('/expiring', expiring);
router.get('/stats', authMiddleware, stats);
router.get('/monthly-expirations', authMiddleware, requireRole('ADMIN'), monthlyExpirations);
router.get('/', authMiddleware, list);
router.get('/:id', authMiddleware, getById);
router.put('/:id', authMiddleware, requireRole('ADMIN'), validateBody(updateExtinguisherSchema), update);
router.delete('/:id', authMiddleware, requireRole('ADMIN'), remove);

export default router;
