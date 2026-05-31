/**
 * =============================================================================
 * FireGuard LTD — Prisma Client Singleton
 * =============================================================================
 * Single shared PrismaClient instance for the notification service.
 * Import this module anywhere database access is required.
 * =============================================================================
 */

import { PrismaClient } from '@prisma/client';

/** Global Prisma client — one connection pool per Node process. */
const prisma = new PrismaClient();

export default prisma;
