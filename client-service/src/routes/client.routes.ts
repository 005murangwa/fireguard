import { Router } from 'express';
import {
  create,
  list,
  getById,
  search,
  update,
  remove,
  history,
  stats,
  monthlyRegistrations,
} from '../controllers/client.controller';
import { validateBody } from '../middleware/validate.middleware';
import { createClientSchema, updateClientSchema } from '../dto/client.dto';

const router = Router();

router.post('/', validateBody(createClientSchema), create);
router.get('/', list);
router.get('/search', search);
router.get('/stats', stats);
router.get('/monthly-registrations', monthlyRegistrations);
router.get('/:id/history', history);
router.get('/:id', getById);
router.put('/:id', validateBody(updateClientSchema), update);
router.delete('/:id', remove);

export default router;
