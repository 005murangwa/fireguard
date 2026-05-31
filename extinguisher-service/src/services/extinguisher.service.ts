import axios from 'axios';
import { ExtinguisherStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { CreateExtinguisherDto, UpdateExtinguisherDto } from '../dto/extinguisher.dto';
import { calculateStatus, daysUntilExpiry } from '../utils/status.util';

function parseDate(dateStr: string): Date {
  if (dateStr.includes('T')) {
    return new Date(dateStr);
  }
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export interface ExtinguisherRecord {
  id: number;
  clientId: number;
  serialNumber: string;
  extinguisherType: string;
  quantity: number;
  purchaseDate: Date;
  expiryDate: Date;
  status: ExtinguisherStatus;
  createdAt: Date;
  updatedAt: Date;
}

async function validateClientExists(clientId: number): Promise<void> {
  const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
  try {
    await axios.get(`${authServiceUrl}/internal/clients/${clientId}`);
  } catch {
    throw new Error('Client not found');
  }
}

export async function createExtinguisher(data: CreateExtinguisherDto): Promise<ExtinguisherRecord> {
  await validateClientExists(data.clientId);

  const existing = await prisma.extinguisher.findUnique({
    where: { serialNumber: data.serialNumber },
  });

  if (existing) {
    throw new Error('Extinguisher with this serial number already exists');
  }

  const purchaseDate = parseDate(data.purchaseDate);
  const expiryDate = parseDate(data.expiryDate);
  const status = calculateStatus(expiryDate);

  return prisma.extinguisher.create({
    data: {
      clientId: data.clientId,
      serialNumber: data.serialNumber,
      extinguisherType: data.extinguisherType,
      quantity: data.quantity,
      purchaseDate,
      expiryDate,
      status,
    },
  });
}

export async function getAllExtinguishers(clientId?: number): Promise<ExtinguisherRecord[]> {
  return prisma.extinguisher.findMany({
    where: clientId ? { clientId } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getExtinguisherById(id: number): Promise<ExtinguisherRecord | null> {
  return prisma.extinguisher.findUnique({ where: { id } });
}

export async function updateExtinguisher(
  id: number,
  data: UpdateExtinguisherDto
): Promise<ExtinguisherRecord> {
  const existing = await prisma.extinguisher.findUnique({ where: { id } });

  if (!existing) {
    throw new Error('Extinguisher not found');
  }

  if (data.clientId) {
    await validateClientExists(data.clientId);
  }

  if (data.serialNumber && data.serialNumber !== existing.serialNumber) {
    const duplicate = await prisma.extinguisher.findUnique({
      where: { serialNumber: data.serialNumber },
    });
    if (duplicate) {
      throw new Error('Extinguisher with this serial number already exists');
    }
  }

  const purchaseDate = data.purchaseDate ? parseDate(data.purchaseDate) : existing.purchaseDate;
  const expiryDate = data.expiryDate ? parseDate(data.expiryDate) : existing.expiryDate;
  const status = calculateStatus(expiryDate);

  return prisma.extinguisher.update({
    where: { id },
    data: {
      clientId: data.clientId,
      serialNumber: data.serialNumber,
      extinguisherType: data.extinguisherType,
      quantity: data.quantity,
      purchaseDate,
      expiryDate,
      status,
    },
  });
}

export async function deleteExtinguisher(id: number): Promise<void> {
  const existing = await prisma.extinguisher.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Extinguisher not found');
  }
  await prisma.extinguisher.delete({ where: { id } });
}

export async function refreshAllStatuses(): Promise<void> {
  const extinguishers = await prisma.extinguisher.findMany();
  for (const ext of extinguishers) {
    const status = calculateStatus(ext.expiryDate);
    if (status !== ext.status) {
      await prisma.extinguisher.update({ where: { id: ext.id }, data: { status } });
    }
  }
}

const NOTIFICATION_DAYS = [
  { days: 30, type: 'THIRTY_DAYS' as const },
  { days: 14, type: 'FOURTEEN_DAYS' as const },
  { days: 7, type: 'SEVEN_DAYS' as const },
  { days: 0, type: 'EXPIRED' as const },
];

export async function getExpiringExtinguishers(
  notificationType: 'THIRTY_DAYS' | 'FOURTEEN_DAYS' | 'SEVEN_DAYS' | 'EXPIRED'
): Promise<ExtinguisherRecord[]> {
  await refreshAllStatuses();

  const config = NOTIFICATION_DAYS.find((n) => n.type === notificationType);
  if (!config) {
    return [];
  }

  const all = await prisma.extinguisher.findMany({ orderBy: { expiryDate: 'asc' } });

  if (config.days === 0) {
    return all.filter((ext) => daysUntilExpiry(ext.expiryDate) <= 0);
  }

  return all.filter((ext) => daysUntilExpiry(ext.expiryDate) === config.days);
}

export async function getExtinguisherStats(clientId?: number) {
  await refreshAllStatuses();

  const where = clientId ? { clientId } : undefined;

  const [total, active, expiringSoon, expired] = await Promise.all([
    prisma.extinguisher.count({ where }),
    prisma.extinguisher.count({ where: { ...where, status: ExtinguisherStatus.ACTIVE } }),
    prisma.extinguisher.count({ where: { ...where, status: ExtinguisherStatus.EXPIRING_SOON } }),
    prisma.extinguisher.count({ where: { ...where, status: ExtinguisherStatus.EXPIRED } }),
  ]);

  return { total, active, expiringSoon, expired };
}

export async function getMonthlyExpirations() {
  const items = await prisma.extinguisher.findMany({
    select: { expiryDate: true },
    orderBy: { expiryDate: 'asc' },
  });

  const monthMap = new Map<string, number>();
  for (const item of items) {
    const month = item.expiryDate.toISOString().slice(0, 7);
    monthMap.set(month, (monthMap.get(month) || 0) + 1);
  }

  return Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }));
}

export async function getExtinguishersByClientId(clientId: number) {
  return prisma.extinguisher.findMany({
    where: { clientId },
    orderBy: { expiryDate: 'asc' },
  });
}
