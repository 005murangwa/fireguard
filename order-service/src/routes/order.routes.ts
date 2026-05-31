import { Router } from 'express';
import {
  create,
  list,
  getById,
  approve,
  reject,
  stats,
  monthly,
  pending,
} from '../controllers/order.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createOrderSchema, rejectOrderSchema } from '../dto/order.dto';

const router = Router();

router.use(authMiddleware);

router.post('/', requireRole('CLIENT'), validateBody(createOrderSchema), create);
router.get('/', list);
router.get('/stats', requireRole('ADMIN'), stats);
router.get('/monthly', requireRole('ADMIN'), monthly);
router.get('/pending', requireRole('ADMIN'), pending);
router.get('/:id', getById);
router.patch('/:id/approve', requireRole('ADMIN'), approve);
router.patch('/:id/reject', requireRole('ADMIN'), validateBody(rejectOrderSchema), reject);

export default router;
