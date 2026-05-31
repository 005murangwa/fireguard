/**
 * Inspection Business Logic Service
 *
 * WHAT: CRUD operations on inspection records + extinguisher status sync.
 * WHY:  Controllers stay thin; all DB and cross-service logic lives here.
 */
import prisma from '../lib/prisma';
import { CreateInspectionDto, UpdateInspectionDto } from '../dto/inspection.dto';
import {
  syncExtinguisherStatus,
  verifyExtinguisherExists,
  getClientExtinguisherCodes,
} from './extinguisher-client.service';
import { resolveStatusFromInspection } from '../utils/status.util';

export interface InspectionRecord {
  id: number;
  extinguisherCode: string;
  inspectorId: number;
  inspectionDate: Date;
  condition: string;
  remarks: string | null;
  nextInspectionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * After persisting an inspection, push status update to fire-extinguisher-service if needed.
 */
async function maybeSyncExtinguisher(
  extinguisherCode: string,
  condition: string,
  nextInspectionDate: Date
): Promise<void> {
  const targetStatus = resolveStatusFromInspection(condition, nextInspectionDate);
  if (targetStatus) {
    await syncExtinguisherStatus(extinguisherCode, targetStatus);
  }
}

/** Create a new inspection; inspectorId comes from JWT (not request body). */
export async function createInspection(
  data: CreateInspectionDto,
  inspectorId: number
): Promise<InspectionRecord> {
  const exists = await verifyExtinguisherExists(data.extinguisherCode);
  if (!exists) {
    throw new Error('Extinguisher not found');
  }

  const record = await prisma.inspection.create({
    data: {
      extinguisherCode: data.extinguisherCode,
      inspectorId,
      inspectionDate: data.inspectionDate,
      condition: data.condition,
      remarks: data.remarks ?? null,
      nextInspectionDate: data.nextInspectionDate,
    },
  });

  await maybeSyncExtinguisher(
    record.extinguisherCode,
    record.condition,
    record.nextInspectionDate
  );

  return record;
}

/** List inspections — ADMIN all; INSPECTOR own; CLIENT assigned extinguishers only. */
export async function listInspections(options?: {
  inspectorId?: number;
  extinguisherCodes?: string[];
}): Promise<InspectionRecord[]> {
  const where: { inspectorId?: number; extinguisherCode?: { in: string[] } } = {};

  if (options?.inspectorId) {
    where.inspectorId = options.inspectorId;
  }
  if (options?.extinguisherCodes) {
    where.extinguisherCode = { in: options.extinguisherCodes };
  }

  return prisma.inspection.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { inspectionDate: 'desc' },
  });
}

/** Fetch single inspection by primary key. */
export async function getInspectionById(id: number): Promise<InspectionRecord | null> {
  return prisma.inspection.findUnique({ where: { id } });
}

/** Full inspection history for one extinguisher code (newest first). */
export async function getInspectionHistory(
  extinguisherCode: string
): Promise<InspectionRecord[]> {
  return prisma.inspection.findMany({
    where: { extinguisherCode },
    orderBy: { inspectionDate: 'desc' },
  });
}

/** Update inspection — triggers status re-sync on fire-extinguisher-service. */
export async function updateInspection(
  id: number,
  data: UpdateInspectionDto
): Promise<InspectionRecord> {
  const existing = await prisma.inspection.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Inspection not found');
  }

  const record = await prisma.inspection.update({
    where: { id },
    data: {
      extinguisherCode: data.extinguisherCode,
      inspectionDate: data.inspectionDate,
      condition: data.condition,
      remarks: data.remarks,
      nextInspectionDate: data.nextInspectionDate,
    },
  });

  await maybeSyncExtinguisher(
    record.extinguisherCode,
    record.condition,
    record.nextInspectionDate
  );

  return record;
}

/** Hard delete — ADMIN only at route level. */
export async function deleteInspection(id: number): Promise<void> {
  const existing = await prisma.inspection.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Inspection not found');
  }
  await prisma.inspection.delete({ where: { id } });
}

/** Helper for ownership middleware — returns inspectorId for a given inspection id. */
export async function getInspectorIdForInspection(id: number): Promise<number> {
  const record = await prisma.inspection.findUnique({
    where: { id },
    select: { inspectorId: true },
  });
  if (!record) {
    throw new Error('Inspection not found');
  }
  return record.inspectorId;
}

/**
 * Returns inspections whose nextInspectionDate is today or in the past.
 * Used by notification-service cron to send due-date alerts.
 */
export async function getDueInspections(): Promise<InspectionRecord[]> {
  return prisma.inspection.findMany({
    where: { nextInspectionDate: { lte: new Date() } },
    orderBy: { nextInspectionDate: 'asc' },
  });
}

/** Flat list of all inspections for reporting-service PDF export. */
export async function getAllInspectionsForReport(): Promise<
  Array<{
    extinguisherCode: string;
    inspectorId: number;
    inspectionDate: Date;
    condition: string;
    nextInspectionDate: Date;
    remarks: string | null;
  }>
> {
  const records = await prisma.inspection.findMany({
    orderBy: { inspectionDate: 'desc' },
    select: {
      extinguisherCode: true,
      inspectorId: true,
      inspectionDate: true,
      condition: true,
      nextInspectionDate: true,
      remarks: true,
    },
  });
  return records;
}

/**
 * Dashboard statistics consumed by reporting-service.
 * dueThisMonth = inspections with nextInspectionDate within current calendar month.
 */
export async function getInspectionStats(): Promise<{
  total: number;
  dueThisMonth: number;
}> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [total, dueThisMonth] = await Promise.all([
    prisma.inspection.count(),
    prisma.inspection.count({
      where: {
        nextInspectionDate: { gte: monthStart, lte: monthEnd },
      },
    }),
  ]);

  return { total, dueThisMonth };
}
