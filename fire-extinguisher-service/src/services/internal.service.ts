/**

 * =============================================================================

 * FireGuard LTD - Fire Extinguisher Internal Service Logic

 * =============================================================================

 * WHAT: Operations exposed only to other microservices (cron, inspection, maintenance).

 * WHY:  Keeps public JWT routes separate from trusted inter-service HTTP calls.

 * =============================================================================

 */



import { ExtinguisherStatus } from '@prisma/client';

import prisma from '../utils/prisma';

import { formatExtinguisher, calculateStatus } from '../utils/extinguisher.util';

import { FireExtinguisherResponse } from '../types';

import { PatchStatusBody } from '../validators/internal.validator';



export class InternalServiceError extends Error {

  constructor(

    message: string,

    public statusCode: number,

    public code: string

  ) {

    super(message);

    this.name = 'InternalServiceError';

  }

}



/**

 * Lookup extinguisher by business code (used before recording inspections).

 */

export async function getExtinguisherByCode(

  code: string

): Promise<FireExtinguisherResponse> {

  const record = await prisma.fireExtinguisher.findUnique({

    where: { extinguisherCode: code },

  });



  if (!record) {

    throw new InternalServiceError('Extinguisher not found', 404, 'NOT_FOUND');

  }



  return formatExtinguisher(record);

}



/**

 * Updates status when inspection or maintenance services report a state change.

 */

export async function patchStatusByCode(

  code: string,

  body: PatchStatusBody

): Promise<FireExtinguisherResponse> {

  const existing = await prisma.fireExtinguisher.findUnique({

    where: { extinguisherCode: code },

  });



  if (!existing) {

    throw new InternalServiceError('Extinguisher not found', 404, 'NOT_FOUND');

  }



  const updated = await prisma.fireExtinguisher.update({

    where: { extinguisherCode: code },

    data: { status: body.status as ExtinguisherStatus },

  });



  if (body.source) {

    console.log(

      `[fire-extinguisher-service] Status ${code} → ${body.status} (source: ${body.source})`

    );

  }



  return formatExtinguisher(updated);

}



/**

 * Recalculates expiration-based statuses for all units (notification cron).

 * Preserves UNDER_MAINTENANCE set explicitly by admins or maintenance workflow.

 */

export async function refreshAllStatuses(): Promise<{ updated: number }> {

  const records = await prisma.fireExtinguisher.findMany();

  let updated = 0;



  for (const record of records) {

    const nextStatus = calculateStatus(record.expirationDate, record.status);

    if (nextStatus !== record.status) {

      await prisma.fireExtinguisher.update({

        where: { id: record.id },

        data: { status: nextStatus },

      });

      updated += 1;

    }

  }



  return { updated };

}



/**

 * Extinguishers expiring within N days (still ACTIVE or INSPECTION_DUE).

 */

export async function listExpiringWithinDays(

  days: number

): Promise<FireExtinguisherResponse[]> {

  const now = new Date();

  const end = new Date(now);

  end.setDate(end.getDate() + days);



  const records = await prisma.fireExtinguisher.findMany({

    where: {

      expirationDate: { gt: now, lte: end },

      status: { in: ['ACTIVE', 'INSPECTION_DUE'] },

    },

    orderBy: { expirationDate: 'asc' },

  });



  return records.map(formatExtinguisher);

}



/** All units currently marked EXPIRED. */

export async function listExpired(): Promise<FireExtinguisherResponse[]> {

  const records = await prisma.fireExtinguisher.findMany({

    where: { status: 'EXPIRED' },

    orderBy: { expirationDate: 'asc' },

  });

  return records.map(formatExtinguisher);

}



/** Aggregate counts for reporting-service dashboard bundle. */

export async function getExtinguisherStats(): Promise<{

  total: number;

  active: number;

  expired: number;

  inspectionDue: number;

  underMaintenance: number;

}> {

  const [total, active, expired, inspectionDue, underMaintenance] = await Promise.all([

    prisma.fireExtinguisher.count(),

    prisma.fireExtinguisher.count({ where: { status: 'ACTIVE' } }),

    prisma.fireExtinguisher.count({ where: { status: 'EXPIRED' } }),

    prisma.fireExtinguisher.count({ where: { status: 'INSPECTION_DUE' } }),

    prisma.fireExtinguisher.count({ where: { status: 'UNDER_MAINTENANCE' } }),

  ]);



  return { total, active, expired, inspectionDue, underMaintenance };

}

/** Return extinguisher codes assigned to a CLIENT user (for inspection/maintenance filtering). */
export async function getExtinguisherCodesByClientId(clientId: number): Promise<string[]> {
  const records = await prisma.fireExtinguisher.findMany({
    where: { assignedClientId: clientId },
    select: { extinguisherCode: true },
  });
  return records.map((r) => r.extinguisherCode);
}


