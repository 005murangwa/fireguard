import prisma from '../lib/prisma';
import { CreateClientDto, UpdateClientDto } from '../dto/client.dto';

export interface ClientRecord {
  id: number;
  fullName: string;
  nationalId: string;
  phoneNumber: string;
  email: string;
  companyName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientHistoryRecord {
  id: number;
  clientId: number;
  action: string;
  changes: string;
  createdAt: Date;
}

async function logHistory(
  clientId: number,
  action: string,
  changes: Record<string, unknown>
): Promise<void> {
  await prisma.clientHistory.create({
    data: {
      clientId,
      action,
      changes: JSON.stringify(changes),
    },
  });
}

export async function createClient(data: CreateClientDto): Promise<ClientRecord> {
  const existing = await prisma.client.findUnique({
    where: { nationalId: data.nationalId },
  });

  if (existing) {
    throw new Error('Client with this National ID already exists');
  }

  const client = await prisma.client.create({ data });

  await logHistory(client.id, 'CREATE', { created: data });

  return client;
}

export async function getAllClients(): Promise<ClientRecord[]> {
  return prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function getClientById(id: number): Promise<ClientRecord | null> {
  return prisma.client.findUnique({ where: { id } });
}

export async function searchClients(query: string): Promise<ClientRecord[]> {
  return prisma.client.findMany({
    where: {
      OR: [
        { fullName: { contains: query } },
        { nationalId: { contains: query } },
        { phoneNumber: { contains: query } },
        { email: { contains: query } },
        { companyName: { contains: query } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateClient(id: number, data: UpdateClientDto): Promise<ClientRecord> {
  const existing = await prisma.client.findUnique({ where: { id } });

  if (!existing) {
    throw new Error('Client not found');
  }

  if (data.nationalId && data.nationalId !== existing.nationalId) {
    const duplicate = await prisma.client.findUnique({
      where: { nationalId: data.nationalId },
    });
    if (duplicate) {
      throw new Error('Client with this National ID already exists');
    }
  }

  const client = await prisma.client.update({
    where: { id },
    data,
  });

  await logHistory(id, 'UPDATE', { before: existing, after: data });

  return client;
}

export async function deleteClient(id: number): Promise<void> {
  const existing = await prisma.client.findUnique({ where: { id } });

  if (!existing) {
    throw new Error('Client not found');
  }

  await logHistory(id, 'DELETE', { deleted: existing });
  await prisma.client.delete({ where: { id } });
}

export async function getClientHistory(id: number): Promise<ClientHistoryRecord[]> {
  const client = await prisma.client.findUnique({ where: { id } });

  if (!client) {
    throw new Error('Client not found');
  }

  return prisma.clientHistory.findMany({
    where: { clientId: id },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getClientStats(): Promise<{ total: number }> {
  const total = await prisma.client.count();
  return { total };
}

export async function getMonthlyRegistrations(): Promise<
  { month: string; count: number }[]
> {
  const clients = await prisma.client.findMany({
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const monthMap = new Map<string, number>();

  for (const client of clients) {
    const month = client.createdAt.toISOString().slice(0, 7);
    monthMap.set(month, (monthMap.get(month) || 0) + 1);
  }

  return Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }));
}

export async function getClientByIdInternal(id: number): Promise<ClientRecord | null> {
  return getClientById(id);
}
