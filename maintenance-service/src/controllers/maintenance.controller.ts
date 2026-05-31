/**
 * Maintenance HTTP Controllers
 *
 * WHAT: Request handlers for maintenance CRUD and complete workflow.
 * WHY:  All endpoints are ADMIN-only — maps HTTP to maintenance.service.ts.
 */
import { Request, Response } from 'express';
import {
  createMaintenance,
  listMaintenanceRecords,
  getMaintenanceById,
  getMaintenanceHistory,
  updateMaintenance,
  completeMaintenance,
  deleteMaintenance,
} from '../services/maintenance.service';
import {
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
  CompleteMaintenanceDto,
} from '../dto/maintenance.dto';
import { getClientExtinguisherCodes } from '../services/extinguisher-client.service';

type ValidatedParamsRequest<T> = Request & { validatedParams?: T };

/** POST /maintenance — schedule work order; sets UNDER_MAINTENANCE on extinguisher */
export async function createHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body as CreateMaintenanceDto;
    const record = await createMaintenance(data);
    res.status(201).json(record);
  } catch (error) {
    handleError(error, res);
  }
}

/** GET /maintenance — role-scoped list */
export async function listHandler(req: Request, res: Response): Promise<void> {
  try {
    const role = req.user!.role;
    let records;

    if (role === 'CLIENT') {
      const codes = await getClientExtinguisherCodes(req.user!.userId);
      records = await listMaintenanceRecords(codes.length ? codes : ['__none__']);
    } else {
      records = await listMaintenanceRecords();
    }

    res.json(records);
  } catch (error) {
    handleError(error, res);
  }
}

/** GET /maintenance/:id — single work order detail */
export async function getByIdHandler(
  req: ValidatedParamsRequest<{ id: number }>,
  res: Response
): Promise<void> {
  try {
    const { id } = req.validatedParams!;
    const record = await getMaintenanceById(id);

    if (!record) {
      res.status(404).json({ error: 'Maintenance record not found', code: 'NOT_FOUND' });
      return;
    }

    res.json(record);
  } catch (error) {
    handleError(error, res);
  }
}

/** GET /maintenance/history/:extinguisherCode — all maintenance for one unit */
export async function historyHandler(
  req: ValidatedParamsRequest<{ extinguisherCode: string }>,
  res: Response
): Promise<void> {
  try {
    const { extinguisherCode } = req.validatedParams!;
    const records = await getMaintenanceHistory(extinguisherCode);
    res.json(records);
  } catch (error) {
    handleError(error, res);
  }
}

/** PATCH /maintenance/:id — update work order fields and re-sync status if needed */
export async function updateHandler(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const data = req.body as UpdateMaintenanceDto;
    const record = await updateMaintenance(id, data);
    res.json(record);
  } catch (error) {
    handleError(error, res);
  }
}

/** POST /maintenance/:id/complete — mark COMPLETED and restore ACTIVE on extinguisher */
export async function completeHandler(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const data = req.body as CompleteMaintenanceDto;
    const record = await completeMaintenance(id, data);
    res.json(record);
  } catch (error) {
    handleError(error, res);
  }
}

/** DELETE /maintenance/:id — remove work order (does not revert extinguisher status) */
export async function deleteHandler(
  req: ValidatedParamsRequest<{ id: number }>,
  res: Response
): Promise<void> {
  try {
    const { id } = req.validatedParams!;
    await deleteMaintenance(id);
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
    if (error.message === 'Maintenance record not found') {
      res.status(404).json({ error: error.message, code: 'NOT_FOUND' });
      return;
    }
    if (error.message === 'Maintenance already completed') {
      res.status(409).json({ error: error.message, code: 'ALREADY_COMPLETED' });
      return;
    }
    if (error.message === 'Cannot complete a cancelled maintenance record') {
      res.status(409).json({ error: error.message, code: 'CANCELLED' });
      return;
    }
    if (error.message === 'Unable to reach fire-extinguisher-service') {
      res.status(503).json({ error: error.message, code: 'SERVICE_UNAVAILABLE' });
      return;
    }
  }

  console.error('[maintenance-service] Unexpected error:', error);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
}
