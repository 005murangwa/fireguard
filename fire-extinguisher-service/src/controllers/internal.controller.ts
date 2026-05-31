/**

 * =============================================================================

 * FireGuard LTD - Internal HTTP Controllers

 * =============================================================================

 * Thin handlers for inter-service routes (no JWT required).

 * =============================================================================

 */



import { Request, Response } from 'express';

import {

  getExtinguisherByCode,

  patchStatusByCode,

  refreshAllStatuses,

  listExpiringWithinDays,

  listExpired,

  getExtinguisherStats,

  getExtinguisherCodesByClientId,

  InternalServiceError,

} from '../services/internal.service';

import { PatchStatusBody, ExpiringQuery } from '../validators/internal.validator';



type ValidatedParamsRequest<T> = Request & { validatedParams?: T };

type ValidatedQueryRequest<T> = Request & { validatedQuery?: T };



/** GET /internal/extinguishers/:code */

export async function getByCodeHandler(

  req: ValidatedParamsRequest<{ code: string }>,

  res: Response

): Promise<void> {

  try {

    const { code } = req.validatedParams!;

    const record = await getExtinguisherByCode(code);

    res.json(record);

  } catch (error) {

    handleError(error, res);

  }

}



/** PATCH /internal/extinguishers/:code/status */

export async function patchStatusHandler(req: Request, res: Response): Promise<void> {

  try {

    const code = req.params.code;

    const body = req.body as PatchStatusBody;

    const record = await patchStatusByCode(code, body);

    res.json(record);

  } catch (error) {

    handleError(error, res);

  }

}



/** POST /internal/refresh-statuses */

export async function refreshStatusesHandler(_req: Request, res: Response): Promise<void> {

  try {

    const result = await refreshAllStatuses();

    res.json(result);

  } catch (error) {

    handleError(error, res);

  }

}



/** GET /internal/expiring?days=30 */

export async function expiringHandler(

  req: ValidatedQueryRequest<ExpiringQuery>,

  res: Response

): Promise<void> {

  try {

    const { days } = req.validatedQuery!;

    const records = await listExpiringWithinDays(days);

    res.json(records);

  } catch (error) {

    handleError(error, res);

  }

}



/** GET /internal/expired */

export async function expiredHandler(_req: Request, res: Response): Promise<void> {

  try {

    const records = await listExpired();

    res.json(records);

  } catch (error) {

    handleError(error, res);

  }

}



/** GET /internal/stats */

export async function statsHandler(_req: Request, res: Response): Promise<void> {

  try {

    const stats = await getExtinguisherStats();

    res.json(stats);

  } catch (error) {

    handleError(error, res);

  }

}

/** GET /internal/clients/:clientId/extinguisher-codes — codes assigned to a CLIENT */
export async function clientCodesHandler(
  req: ValidatedParamsRequest<{ clientId: number }>,
  res: Response
): Promise<void> {
  try {
    const { clientId } = req.validatedParams!;
    const codes = await getExtinguisherCodesByClientId(clientId);
    res.json(codes);
  } catch (error) {
    handleError(error, res);
  }
}



function handleError(error: unknown, res: Response): void {

  if (error instanceof InternalServiceError) {

    res.status(error.statusCode).json({ error: error.message, code: error.code });

    return;

  }



  console.error('[fire-extinguisher-service] Internal API error:', error);

  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });

}


