/**
 * =============================================================================
 * FireGuard LTD - Fire Extinguisher Service Application Entry Point
 * =============================================================================
 * WHAT: Express server for extinguisher inventory management (port 5003).
 * WHY:  Replaces legacy extinguisher-service with QR scanning and RBAC.
 * =============================================================================
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './utils/prisma';
import extinguisherRoutes from './routes/extinguisher.routes';
import internalRoutes from './routes/internal.routes';
import { setupSwagger } from './swagger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

// --- Global middleware -------------------------------------------------------
app.use(cors());
app.use(express.json());

// --- OpenAPI / Swagger documentation -----------------------------------------
setupSwagger(app);

// --- Health check endpoint ---------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'fire-extinguisher-service',
    port: PORT,
    description: 'FireGuard LTD fire extinguisher inventory with QR scanning',
  });
});

// --- Internal service-to-service routes (no JWT) -----------------------------
app.use('/internal', internalRoutes);

// --- Public API routes (JWT protected) ---------------------------------------
app.use('/', extinguisherRoutes);

// --- Error handling (order matters — 404 before global error handler) --------
app.use(notFoundHandler);
app.use(errorHandler);

/** Bootstraps database connection then starts HTTP listener. */
async function start(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('[fire-extinguisher-service] Connected to MySQL via Prisma');
  } catch (error) {
    console.error('[fire-extinguisher-service] Database connection failed:', error);
    console.error('[fire-extinguisher-service] Ensure XAMPP MySQL is running and DATABASE_URL is set');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[fire-extinguisher-service] Running on http://localhost:${PORT}`);
    console.log(`[fire-extinguisher-service] Swagger UI: http://localhost:${PORT}/api-docs`);
  });
}

start();

export default app;
