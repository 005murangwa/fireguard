/**

 * =============================================================================

 * FireGuard LTD - Internal API Zod Schemas

 * =============================================================================

 * WHAT: Validation for service-to-service calls (no end-user JWT).

 * WHY:  inspection-service and maintenance-service PATCH status via these routes.

 * =============================================================================

 */



import { z } from 'zod';



/** Route param: extinguisher business code */

export const extinguisherCodeParamSchema = z.object({

  code: z.string().min(1).max(50),

});



/** PATCH /internal/extinguishers/:code/status request body */

export const patchStatusBodySchema = z.object({

  status: z.enum(['ACTIVE', 'EXPIRED', 'UNDER_MAINTENANCE', 'INSPECTION_DUE']),

  /** Optional caller id for audit logs (e.g. inspection-service) */

  source: z.string().max(100).optional(),

});



/** GET /internal/expiring query string */

export const expiringQuerySchema = z.object({

  days: z.coerce.number().int().min(1).max(365).default(30),

});

/** Route param: client user id */
export const clientIdParamSchema = z.object({
  clientId: z.coerce.number().int().positive(),
});



export type ExtinguisherCodeParam = z.infer<typeof extinguisherCodeParamSchema>;

export type PatchStatusBody = z.infer<typeof patchStatusBodySchema>;

export type ExpiringQuery = z.infer<typeof expiringQuerySchema>;


