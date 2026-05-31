/**
 * Prisma Client Singleton — Maintenance Service
 *
 * WHAT: Single shared PrismaClient for the maintenance microservice.
 * WHY:  Avoids connection pool exhaustion from multiple client instances.
 * HOW:  Import this default export in services only — never in route files.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
