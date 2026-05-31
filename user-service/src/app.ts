/**
 * =============================================================================
 * FireGuard LTD - User Service Application Entry Point
 * =============================================================================
 * WHAT: Express server bootstrap for admin user management (port 5002).
 * WHY:  Dedicated microservice so auth-service stays focused on login/register.
 * =============================================================================
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './utils/prisma';
import userRoutes from './routes/user.routes';
import internalRoutes from './routes/internal.routes';
import { setupSwagger } from './swagger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Load environment variables from .env before accessing process.env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// --- Global middleware -------------------------------------------------------
app.use(cors());
app.use(express.json());

// --- OpenAPI documentation ---------------------------------------------------
setupSwagger(app);

// --- Health check (no auth — used by orchestrators / dev scripts) ------------
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'user-service',
    port: PORT,
    description: 'FireGuard LTD admin user management',
  });
});

// --- Internal service-to-service routes (no JWT) -----------------------------
app.use('/internal', internalRoutes);

// --- Public API routes (JWT protected) ---------------------------------------
app.use('/', userRoutes);

// --- Error handling (order matters — 404 before global error handler) --------
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Starts the HTTP server after verifying database connectivity.
 */
async function start(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('[user-service] Connected to MySQL via Prisma');
  } catch (error) {
    console.error('[user-service] Database connection failed:', error);
    console.error('[user-service] Ensure XAMPP MySQL is running and DATABASE_URL is set');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[user-service] Running on http://localhost:${PORT}`);
    console.log(`[user-service] Swagger UI: http://localhost:${PORT}/api-docs`);
  });
}

start();

export default app;
