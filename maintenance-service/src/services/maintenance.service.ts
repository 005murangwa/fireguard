/**
 * Maintenance Business Logic Service
 *
 * WHAT: CRUD + complete workflow for maintenance work orders.
 * WHY:  Centralizes DB access and fire-extinguisher status synchronization.
 */
import { MaintenanceStatus as PrismaMaintenanceStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import {
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
  CompleteMaintenanceDto,
} from '../dto/maintenance.dto';
import {
  syncExtinguisherStatus,
  verifyExtinguisherExists,
  getClientExtinguisherCodes,
} from './extinguisher-client.service';
import { resolveExtinguisherStatusFromMaintenance } from '../utils/status.util';
import { MaintenanceStatus } from '../types';

export interface MaintenanceRecord {
  id: number;
  extinguisherCode: string;
  maintenanceDate: Date;
  description: string;
  technician: string;
  status: PrismaMaintenanceStatus;
  createdAt: Date;
  updatedAt: Date;
}

async function applyStatusSync(
  extinguisherCode: string,
  status: MaintenanceStatus
): Promise<void> {
  const target = resolveExtinguisherStatusFromMaintenance(status);
  if (target) {
    await syncExtinguisherStatus(extinguisherCode, target);
  }
}

/** Create maintenance record; SCHEDULED status sets extinguisher to UNDER_MAINTENANCE. */
export async function createMaintenance(
  data: CreateMaintenanceDto
): Promise<MaintenanceRecord> {
  const exists = await verifyExtinguisherExists(data.extinguisherCode);
  if (!exists) {
    throw new Error('Extinguisher not found');
  }

  const status = (data.status ?? 'SCHEDULED') as PrismaMaintenanceStatus;

  const record = await prisma.maintenanceRecord.create({
    data: {
      extinguisherCode: data.extinguisherCode,
      maintenanceDate: data.maintenanceDate,
      description: data.description,
      technician: data.technician,
      status,
    },
  });

  await applyStatusSync(record.extinguisherCode, record.status as MaintenanceStatus);
  return record;
}

/** List maintenance records — optional filter by extinguisher codes (CLIENT view). */
export async function listMaintenanceRecords(
  extinguisherCodes?: string[]
): Promise<MaintenanceRecord[]> {
  return prisma.maintenanceRecord.findMany({
    where: extinguisherCodes
      ? { extinguisherCode: { in: extinguisherCodes } }
      : undefined,
    orderBy: { maintenanceDate: 'desc' },
  });
}

/** Get single record by id. */
export async function getMaintenanceById(
  id: number
): Promise<MaintenanceRecord | null> {
  return prisma.maintenanceRecord.findUnique({ where: { id } });
}

/** History for one extinguisher code. */
export async function getMaintenanceHistory(
  extinguisherCode: string
): Promise<MaintenanceRecord[]> {
  return prisma.maintenanceRecord.findMany({
    where: { extinguisherCode },
    orderBy: { maintenanceDate: 'desc' },
  });
}

/** Update maintenance record and re-sync extinguisher status if status changed. */
export async function updateMaintenance(
  id: number,
  data: UpdateMaintenanceDto
): Promise<MaintenanceRecord> {
  const existing = await prisma.maintenanceRecord.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Maintenance record not found');
  }

  const record = await prisma.maintenanceRecord.update({
    where: { id },
    data: {
      extinguisherCode: data.extinguisherCode,
      maintenanceDate: data.maintenanceDate,
      description: data.description,
      technician: data.technician,
      status: data.status as PrismaMaintenanceStatus | undefined,
    },
  });

  if (data.status) {
    await applyStatusSync(record.extinguisherCode, record.status as MaintenanceStatus);
  }

  return record;
}

/**
 * Complete maintenance workflow — sets status to COMPLETED and restores ACTIVE on extinguisher.
 * Optionally updates description and actual completion date.
 */
export async function completeMaintenance(
  id: number,
  data: CompleteMaintenanceDto
): Promise<MaintenanceRecord> {
  const existing = await prisma.maintenanceRecord.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Maintenance record not found');
  }

  if (existing.status === 'COMPLETED') {
    throw new Error('Maintenance already completed');
  }

  if (existing.status === 'CANCELLED') {
    throw new Error('Cannot complete a cancelled maintenance record');
  }

  const record = await prisma.maintenanceRecord.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      maintenanceDate: data.maintenanceDate ?? existing.maintenanceDate,
      description: data.description
        ? `${existing.description}\n[Completed] ${data.description}`
        : existing.description,
    },
  });

  await applyStatusSync(record.extinguisherCode, 'COMPLETED');
  return record;
}

/** Delete maintenance record (ADMIN). Does not revert extinguisher status. */
export async function deleteMaintenance(id: number): Promise<void> {
  const existing = await prisma.maintenanceRecord.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Maintenance record not found');
  }
  await prisma.maintenanceRecord.delete({ where: { id } });
}

/** Count records grouped by status for dashboard stats. */
export async function getMaintenanceStats() {
  const [scheduled, inProgress, completed, cancelled] = await Promise.all([
    prisma.maintenanceRecord.count({ where: { status: 'SCHEDULED' } }),
    prisma.maintenanceRecord.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.maintenanceRecord.count({ where: { status: 'COMPLETED' } }),
    prisma.maintenanceRecord.count({ where: { status: 'CANCELLED' } }),
  ]);
  return { scheduled, inProgress, completed, cancelled, total: scheduled + inProgress + completed + cancelled };
}

/**
 * Active work orders needing reminder emails (SCHEDULED or IN_PROGRESS).
 * Consumed by notification-service cron.
 */
export async function getMaintenanceReminders(): Promise<MaintenanceRecord[]> {
  return prisma.maintenanceRecord.findMany({
    where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
    orderBy: { maintenanceDate: 'asc' },
  });
}

/** Flat list for reporting-service maintenance PDF. */
export async function getAllMaintenanceForReport(): Promise<
  Array<{
    extinguisherCode: string;
    maintenanceDate: Date;
    description: string;
    technician: string;
    status: PrismaMaintenanceStatus;
  }>
> {
  return prisma.maintenanceRecord.findMany({
    orderBy: { maintenanceDate: 'desc' },
    select: {
      extinguisherCode: true,
      maintenanceDate: true,
      description: true,
      technician: true,
      status: true,
    },
  });
}

/** Stats shape expected by reporting-service data aggregator. */
export async function getMaintenanceReportStats(): Promise<{
  total: number;
  scheduled: number;
  completed: number;
}> {
  const [total, scheduled, completed] = await Promise.all([
    prisma.maintenanceRecord.count(),
    prisma.maintenanceRecord.count({ where: { status: 'SCHEDULED' } }),
    prisma.maintenanceRecord.count({ where: { status: 'COMPLETED' } }),
  ]);
  return { total, scheduled, completed };
}
