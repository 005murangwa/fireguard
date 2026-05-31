/**
 * =============================================================================
 * FireGuard LTD - Fire Extinguisher HTTP Controllers
 * =============================================================================
 * Thin handlers mapping HTTP requests to service layer calls.
 * =============================================================================
 */

import { Request, Response } from 'express';
import {
  createExtinguisher,
  listExtinguishers,
  getExtinguisherById,
  updateExtinguisher,
  deleteExtinguisher,
  scanByCode,
  ExtinguisherServiceError,
} from '../services/extinguisher.service';
import {
  CreateExtinguisherInput,
  UpdateExtinguisherInput,
  ListExtinguishersQuery,
} from '../validators/extinguisher.validator';

type ValidatedQueryRequest<T> = Request & { validatedQuery?: T };
type ValidatedParamsRequest<T> = Request & { validatedParams?: T };

/** POST /extinguishers — Create unit with QR code (ADMIN). */
export async function createHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body as CreateExtinguisherInput;
    const record = await createExtinguisher(data);
    res.status(201).json(record);
  } catch (error) {
    handleError(error, res);
  }
}

/** GET /extinguishers — List with search/filter/pagination (all roles). */
export async function listHandler(
  req: ValidatedQueryRequest<ListExtinguishersQuery>,
  res: Response
): Promise<void> {
  try {
    const query = req.validatedQuery!;
    const result = await listExtinguishers(req.user!, query);
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
}

/** GET /extinguishers/:id — Single record (role-scoped). */
export async function getByIdHandler(
  req: ValidatedParamsRequest<{ id: number }>,
  res: Response
): Promise<void> {
  try {
    const { id } = req.validatedParams!;
    const record = await getExtinguisherById(req.user!, id);
    res.json(record);
  } catch (error) {
    handleError(error, res);
  }
}

/** PATCH /extinguishers/:id — Update record (ADMIN). */
export async function updateHandler(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const data = req.body as UpdateExtinguisherInput;
    const record = await updateExtinguisher(id, data);
    res.json(record);
  } catch (error) {
    handleError(error, res);
  }
}

/** DELETE /extinguishers/:id — Remove record (ADMIN). */
export async function deleteHandler(
  req: ValidatedParamsRequest<{ id: number }>,
  res: Response
): Promise<void> {
  try {
    const { id } = req.validatedParams!;
    await deleteExtinguisher(id);
    res.status(204).send();
  } catch (error) {
    handleError(error, res);
  }
}

/** GET /scan/:code — QR code scan lookup (role-scoped read). */
export async function scanHandler(
  req: ValidatedParamsRequest<{ code: string }>,
  res: Response
): Promise<void> {
  try {
    const { code } = req.validatedParams!;
    const result = await scanByCode(req.user!, code);
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
}

/** Maps service errors to appropriate HTTP status codes. */
function handleError(error: unknown, res: Response): void {
  if (error instanceof ExtinguisherServiceError) {
    res.status(error.statusCode).json({ error: error.message, code: error.code });
    return;
  }

  if (error instanceof Error && (error.message.includes('client not found') || error.message.includes('not a CLIENT') || error.message.includes('verify client'))) {
    res.status(400).json({ error: error.message, code: 'INVALID_CLIENT' });
    return;
  }

  console.error('[fire-extinguisher-service] Unexpected error:', error);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
}
