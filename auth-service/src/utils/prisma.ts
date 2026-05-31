/**
 * =============================================================================
 * FireGuard LTD — Prisma Client Singleton
 * =============================================================================
 * WHAT:  Exports a single shared PrismaClient instance for the auth service.
 * WHY:  Prisma recommends one client per process to avoid connection pool churn
 *        during hot reload in development (tsx watch).
 * HOW:  Import `prisma` in services; call prisma.$connect() once at startup.
 * =============================================================================
 */

import { PrismaClient } from '@prisma/client';

/**
 * Global Prisma client used by all service-layer database operations.
 * In dev, tsx may reload modules — attaching to globalThis prevents
 * "too many connections" errors on Windows/XAMPP MySQL.
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
