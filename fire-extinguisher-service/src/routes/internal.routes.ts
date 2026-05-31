/**

 * =============================================================================

 * FireGuard LTD - Internal (Service-to-Service) Routes

 * =============================================================================

 * WHAT: Unauthenticated endpoints for cron jobs and peer microservices.

 * WHY:  inspection/maintenance/notification/reporting call these without user JWT.

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

} from '../validators/internal.validator';

import {

  getByCodeHandler,

  patchStatusHandler,

  refreshStatusesHandler,

  expiringHandler,

  expiredHandler,

  statsHandler,

  clientCodesHandler,

} from '../controllers/internal.controller';



const router = Router();



/**

 * @swagger

 * /internal/extinguishers/{code}:

 *   get:

 *     summary: Lookup extinguisher by code (inter-service)

 *     tags: [Internal]

 *     parameters:

 *       - in: path

 *         name: code

 *         required: true

 *         schema:

 *           type: string

 *     responses:

 *       200:

 *         description: Extinguisher record

 *       404:

 *         description: Not found

 */

router.get(

  '/extinguishers/:code',

  validateParams(extinguisherCodeParamSchema),

  getByCodeHandler

);



/**

 * @swagger

 * /internal/extinguishers/{code}/status:

 *   patch:

 *     summary: Update extinguisher status from inspection or maintenance service

 *     tags: [Internal]

 *     parameters:

 *       - in: path

 *         name: code

 *         required: true

 *         schema:

 *           type: string

 *     requestBody:

 *       required: true

 *       content:

 *         application/json:

 *           schema:

 *             type: object

 *             required: [status]

 *             properties:

 *               status:

 *                 type: string

 *                 enum: [ACTIVE, EXPIRED, UNDER_MAINTENANCE, INSPECTION_DUE]

 *               source:

 *                 type: string

 *     responses:

 *       200:

 *         description: Updated extinguisher

 */

router.patch(

  '/extinguishers/:code/status',

  validateParams(extinguisherCodeParamSchema),

  validateBody(patchStatusBodySchema),

  patchStatusHandler

);



/**

 * @swagger

 * /internal/refresh-statuses:

 *   post:

 *     summary: Recalculate expiration-based statuses (notification cron)

 *     tags: [Internal]

 *     responses:

 *       200:

 *         description: Count of updated records

 */

router.post('/refresh-statuses', refreshStatusesHandler);



/**

 * @swagger

 * /internal/expiring:

 *   get:

 *     summary: Extinguishers expiring within N days

 *     tags: [Internal]

 *     parameters:

 *       - in: query

 *         name: days

 *         schema:

 *           type: integer

 *           default: 30

 *     responses:

 *       200:

 *         description: List of expiring extinguishers

 */

router.get('/expiring', validateQuery(expiringQuerySchema), expiringHandler);



/**

 * @swagger

 * /internal/expired:

 *   get:

 *     summary: All extinguishers with EXPIRED status

 *     tags: [Internal]

 *     responses:

 *       200:

 *         description: Expired extinguisher list

 */

router.get('/expired', expiredHandler);



/**

 * @swagger

 * /internal/stats:

 *   get:

 *     summary: Aggregate extinguisher counts by status

 *     tags: [Internal]

 *     responses:

 *       200:

 *         description: Status breakdown for reporting dashboard

 */

router.get('/stats', statsHandler);

router.get(
  '/clients/:clientId/extinguisher-codes',
  validateParams(clientIdParamSchema),
  clientCodesHandler
);

export default router;


