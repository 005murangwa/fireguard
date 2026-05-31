import { FollowUpStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { CreateFollowUpDto, UpdateFollowUpDto } from '../dto/follow-up.dto';

export interface FollowUpRecord {
  id: number;
  clientId: number;
  extinguisherId: number;
  status: FollowUpStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function createFollowUp(data: CreateFollowUpDto): Promise<FollowUpRecord> {
  return prisma.followUp.create({
    data: {
      clientId: data.clientId,
      extinguisherId: data.extinguisherId,
      notes: data.notes,
    },
  });
}

export async function getAllFollowUps(clientId?: number): Promise<FollowUpRecord[]> {
  return prisma.followUp.findMany({
    where: clientId ? { clientId } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getFollowUpById(id: number): Promise<FollowUpRecord | null> {
  return prisma.followUp.findUnique({ where: { id } });
}

export async function updateFollowUp(id: number, data: UpdateFollowUpDto): Promise<FollowUpRecord> {
  const existing = await prisma.followUp.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Follow-up not found');
  }
  return prisma.followUp.update({
    where: { id },
    data: { status: data.status, notes: data.notes },
  });
}

export async function deleteFollowUp(id: number): Promise<void> {
  const existing = await prisma.followUp.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Follow-up not found');
  }
  await prisma.followUp.delete({ where: { id } });
}

export async function getPendingCount(): Promise<number> {
  return prisma.followUp.count({
    where: { status: { in: [FollowUpStatus.PENDING, FollowUpStatus.UNREACHABLE] } },
  });
}

export async function getFollowUpStats() {
  const [pending, contacted, unreachable, escalated, resolved] = await Promise.all([
    prisma.followUp.count({ where: { status: FollowUpStatus.PENDING } }),
    prisma.followUp.count({ where: { status: FollowUpStatus.CONTACTED } }),
    prisma.followUp.count({ where: { status: FollowUpStatus.UNREACHABLE } }),
    prisma.followUp.count({ where: { status: FollowUpStatus.ESCALATED } }),
    prisma.followUp.count({ where: { status: FollowUpStatus.RESOLVED } }),
  ]);
  return { pending, contacted, unreachable, escalated, resolved };
}
