import { Router } from 'express';
import {
  create,
  list,
  getById,
  update,
  remove,
  pending,
  stats,
} from '../controllers/follow-up.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createFollowUpSchema, updateFollowUpSchema } from '../dto/follow-up.dto';

const router = Router();

router.post('/', create);
router.get('/stats/pending', authMiddleware, requireRole('ADMIN'), pending);
router.get('/stats', authMiddleware, requireRole('ADMIN'), stats);
router.get('/', authMiddleware, list);
router.get('/:id', authMiddleware, getById);
router.put('/:id', authMiddleware, requireRole('ADMIN'), validateBody(updateFollowUpSchema), update);
router.delete('/:id', authMiddleware, requireRole('ADMIN'), remove);

export default router;
