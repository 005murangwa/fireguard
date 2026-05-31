/**
 * =============================================================================
 * FireGuard LTD — Database Seed Script
 * =============================================================================
 * WHAT:  Inserts default ADMIN, INSPECTOR, and CLIENT users for local demos.
 * WHY:   Developers need verified accounts immediately after `npm run db:setup`
 *        without going through the OTP signup flow every time.
 * HOW:   Run via `npm run db:seed` or `npx prisma db seed`.
 *        Passwords are bcrypt-hashed; plain text is Admin123! for all three.
 * =============================================================================
 */

import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Shared demo password — matches academic project README conventions. */
const SEED_PASSWORD = 'Admin123!';

/** Default phone placeholder used for seeded staff accounts. */
const DEFAULT_PHONE = '+250780000000';

interface SeedUser {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

/**
 * Canonical seed users requested for FireGuard LTD demos.
 * All accounts are pre-verified so login works without OTP.
 */
const SEED_USERS: SeedUser[] = [
  {
    firstName: 'admin',
    lastName: 'User',
    email: 'admin@fireguard.com',
    role: Role.ADMIN,
  },
  {
    firstName: 'inspector',
    lastName: 'User',
    email: 'inspector@fireguard.com',
    role: Role.INSPECTOR,
  },
  {
    firstName: 'client',
    lastName: 'User',
    email: 'client@fireguard.com',
    role: Role.CLIENT,
  },
];

async function main(): Promise<void> {
  const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 12);

  for (const user of SEED_USERS) {
    // upsert keeps seed idempotent — safe to re-run after db:setup
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: DEFAULT_PHONE,
        password: hashedPassword,
        role: user.role,
        isVerified: true,
      },
      create: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: DEFAULT_PHONE,
        password: hashedPassword,
        role: user.role,
        isVerified: true,
      },
    });

    console.log(`[seed] ${user.role} → ${user.email}`);
  }

  console.log('[seed] All default users ready (password: Admin123!)');
}

main()
  .catch((error) => {
    console.error('[seed] Failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
