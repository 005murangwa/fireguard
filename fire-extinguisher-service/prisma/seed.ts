/**
 * FireGuard LTD — Demo extinguisher seed data.
 * Assigns sample units to client@fireguard.com so the CLIENT portal is not empty.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const clientRows = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM users WHERE email = 'client@fireguard.com' LIMIT 1
  `;
  const clientId = clientRows[0]?.id;
  if (!clientId) {
    console.warn('[seed-ext] client@fireguard.com not found — run auth db:seed first');
    return;
  }

  const samples = [
    {
      extinguisherCode: 'FE-DEMO-001',
      type: 'CO2',
      manufacturer: 'FireGuard Industries',
      capacity: '5kg',
      installationLocation: 'Building A — Reception',
      manufacturingDate: new Date('2023-01-15'),
      expirationDate: new Date('2026-06-15'),
      status: 'ACTIVE' as const,
      assignedClientId: clientId,
    },
    {
      extinguisherCode: 'FE-DEMO-002',
      type: 'Foam',
      manufacturer: 'SafeTech Ltd',
      capacity: '9L',
      installationLocation: 'Building B — Server Room',
      manufacturingDate: new Date('2022-08-01'),
      expirationDate: new Date('2025-08-01'),
      status: 'INSPECTION_DUE' as const,
      assignedClientId: clientId,
    },
    {
      extinguisherCode: 'FE-DEMO-003',
      type: 'Dry Powder',
      manufacturer: 'FireGuard Industries',
      capacity: '6kg',
      installationLocation: 'Warehouse — Bay 3',
      manufacturingDate: new Date('2021-03-10'),
      expirationDate: new Date('2025-03-10'),
      status: 'ACTIVE' as const,
      assignedClientId: clientId,
    },
  ];

  for (const item of samples) {
    await prisma.fireExtinguisher.upsert({
      where: { extinguisherCode: item.extinguisherCode },
      update: { ...item, qrCodeData: `QR:${item.extinguisherCode}` },
      create: { ...item, qrCodeData: `QR:${item.extinguisherCode}` },
    });
    console.log(`[seed-ext] ${item.extinguisherCode} → client id ${clientId}`);
  }

  console.log('[seed-ext] Demo extinguishers ready for CLIENT portal');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
