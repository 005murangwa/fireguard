/**
 * =============================================================================
 * FireGuard LTD - User Service Prisma Client Singleton
 * =============================================================================
 * WHAT: Single shared PrismaClient instance for the entire service.
 * WHY:  Prevents connection pool exhaustion from multiple client instances.
 * =============================================================================
 */

import { PrismaClient } from '@prisma/client';

/** Global Prisma client — imported by services only, never by routes directly. */
const prisma = new PrismaClient();

export default prisma;
