/**
 * =============================================================================
 * FireGuard LTD - Internal (Service-to-Service) Routes
 * =============================================================================
 * WHAT: Unauthenticated endpoints for cron jobs and peer microservices.
 * WHY:  inspection/maintenance/notification/order call these without user JWT.
 * NOTE: Restrict to private network in production deployments.
 * =============================================================================
 */

import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware';
import {
  extinguisherCodeParamSchema,
  patchStatusBodySchema,
  expiringQuerySchema,
  clientIdParamSchema,
  fromOrderBodySchema,
} from '../validators/internal.validator';
import {
  getByCodeHandler,
  patchStatusHandler,
  refreshStatusesHandler,
  expiringHandler,
  expiredHandler,
  statsHandler,
  clientCodesHandler,
  fromOrderHandler,
} from '../controllers/internal.controller';

const router = Router();

/** Lookup extinguisher by code (inter-service). */
router.get(
  '/extinguishers/:code',
  validateParams(extinguisherCodeParamSchema),
  getByCodeHandler
);

/** Update status from inspection/maintenance services. */
router.patch(
  '/extinguishers/:code/status',
  validateParams(extinguisherCodeParamSchema),
  validateBody(patchStatusBodySchema),
  patchStatusHandler
);

/** Recalculate all statuses (notification cron). */
router.post('/refresh-statuses', refreshStatusesHandler);

/** Units expiring within N days. */
router.get('/expiring', validateQuery(expiringQuerySchema), expiringHandler);

/** Units currently EXPIRED. */
router.get('/expired', expiredHandler);

/** Aggregate status counts for reporting/dashboard. */
router.get('/stats', statsHandler);

/** Fulfill an approved client purchase order. */
router.post('/from-order', validateBody(fromOrderBodySchema), fromOrderHandler);

/** Extinguisher codes assigned to a CLIENT. */
router.get(
  '/clients/:clientId/extinguisher-codes',
  validateParams(clientIdParamSchema),
  clientCodesHandler
);

export default router;
