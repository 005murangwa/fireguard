/**
 * Inspection HTTP Controllers
 *
 * WHAT: Thin request/response handlers for inspection CRUD endpoints.
 * WHY:  Maps HTTP semantics (status codes, JSON) to inspection.service.ts calls.
 * RBAC: INSPECTOR owns create/update on own records; ADMIN has full access.
 */
import { Request, Response } from 'express';
import {
  createInspection,
  listInspections,
  getInspectionById,
  getInspectionHistory,
  updateInspection,
  deleteInspection,
} from '../services/inspection.service';
import {
  CreateInspectionDto,
  UpdateInspectionDto,
} from '../dto/inspection.dto';
import { getClientExtinguisherCodes } from '../services/extinguisher-client.service';

type ValidatedParamsRequest<T> = Request & { validatedParams?: T };

/** POST /inspections — INSPECTOR creates record with JWT userId as inspectorId */
export async function createHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body as CreateInspectionDto;
    const inspectorId = req.user!.userId;
    const record = await createInspection(data, inspectorId);
    res.status(201).json(record);
  } catch (error) {
    handleError(error, res);
  }
}

/** GET /inspections — role-scoped list */
export async function listHandler(req: Request, res: Response): Promise<void> {
  try {
    const role = req.user!.role;
    let records;

    if (role === 'ADMIN') {
      records = await listInspections();
    } else if (role === 'INSPECTOR') {
      records = await listInspections({ inspectorId: req.user!.userId });
    } else {
      const codes = await getClientExtinguisherCodes(req.user!.userId);
      records = await listInspections({ extinguisherCodes: codes.length ? codes : ['__none__'] });
    }

    res.json(records);
  } catch (error) {
    handleError(error, res);
  }
}

/** GET /inspections/:id — ownership enforced by requireOwnInspectionOrAdmin middleware */
export async function getByIdHandler(
  req: ValidatedParamsRequest<{ id: number }>,
  res: Response
): Promise<void> {
  try {
    const { id } = req.validatedParams!;
    const record = await getInspectionById(id);

    if (!record) {
      res.status(404).json({ error: 'Inspection not found', code: 'NOT_FOUND' });
      return;
    }

    res.json(record);
  } catch (error) {
    handleError(error, res);
  }
}

/** GET /inspections/history/:extinguisherCode — full timeline for one unit */
export async function historyHandler(
  req: ValidatedParamsRequest<{ extinguisherCode: string }>,
  res: Response
): Promise<void> {
  try {
    const { extinguisherCode } = req.validatedParams!;
    const records = await getInspectionHistory(extinguisherCode);
    res.json(records);
  } catch (error) {
    handleError(error, res);
  }
}

/** PATCH /inspections/:id — update + re-sync extinguisher status */
export async function updateHandler(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const data = req.body as UpdateInspectionDto;
    const record = await updateInspection(id, data);
    res.json(record);
  } catch (error) {
    handleError(error, res);
  }
}

/** DELETE /inspections/:id — ADMIN only */
export async function deleteHandler(
  req: ValidatedParamsRequest<{ id: number }>,
  res: Response
): Promise<void> {
  try {
    const { id } = req.validatedParams!;
    await deleteInspection(id);
    res.status(204).send();
  } catch (error) {
    handleError(error, res);
  }
}

function handleError(error: unknown, res: Response): void {
  if (error instanceof Error) {
    if (error.message === 'Extinguisher not found') {
      res.status(404).json({ error: error.message, code: 'EXTINGUISHER_NOT_FOUND' });
      return;
    }
    if (error.message === 'Inspection not found') {
      res.status(404).json({ error: error.message, code: 'NOT_FOUND' });
      return;
    }
    if (error.message === 'Unable to reach fire-extinguisher-service') {
      res.status(503).json({ error: error.message, code: 'SERVICE_UNAVAILABLE' });
      return;
    }
  }

  console.error('[inspection-service] Unexpected error:', error);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
}
