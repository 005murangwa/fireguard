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
import { createExtinguisher } from './extinguisher.service';
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

const ORDER_TYPE_DEFAULTS: Record<string, { manufacturer: string; capacity: string }> = {
  CO2: { manufacturer: 'Kidde', capacity: '5kg' },
  Foam: { manufacturer: 'Ansul', capacity: '9L' },
  'Dry Powder': { manufacturer: 'Amerex', capacity: '6kg' },
  Water: { manufacturer: 'FireGuard', capacity: '9L' },
};

/** POST /internal/from-order — register units after admin approves a client purchase order. */
export async function createExtinguishersFromOrder(input: {
  clientId: number;
  orderNumber: string;
  items: { type: string; quantity: number }[];
}): Promise<FireExtinguisherResponse[]> {
  const created: FireExtinguisherResponse[] = [];
  const manufacturingDate = new Date().toISOString().slice(0, 10);
  const expirationDate = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  for (const item of input.items) {
    const defaults = ORDER_TYPE_DEFAULTS[item.type] || {
      manufacturer: 'FireGuard',
      capacity: 'Standard',
    };

    for (let i = 0; i < item.quantity; i++) {
      const record = await createExtinguisher({
        type: item.type,
        manufacturer: defaults.manufacturer,
        capacity: defaults.capacity,
        installationLocation: `Order ${input.orderNumber} — site survey pending`,
        manufacturingDate,
        expirationDate,
        assignedClientId: input.clientId,
      });
      created.push(record);
    }
  }

  return created;
}

