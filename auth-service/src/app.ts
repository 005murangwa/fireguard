/**
 * =============================================================================
 * FireGuard LTD — Auth Service Application Entry Point
 * =============================================================================
 * WHAT:  Express app bootstrap — middleware, routes, Swagger, error handling.
 * WHY:  Single entry for `npm run dev` and production `node dist/app.js`.
 * HOW:  Loads .env, connects Prisma to MySQL, listens on PORT (default 5001).
 * =============================================================================
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './utils/prisma';
import authRoutes from './routes/auth.routes';
import { setupSwagger } from './swagger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Load environment variables from auth-service/.env before other imports use them
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

/** Allow browser clients (React frontend) to call this service during dev. */
app.use(cors());

/** Parse JSON request bodies for POST /signup, /login, etc. */
app.use(express.json());

// ---------------------------------------------------------------------------
// API documentation (Swagger UI)
// ---------------------------------------------------------------------------
setupSwagger(app);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/** Liveness probe for Docker, API Gateway, and manual health checks. */
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'auth-service',
    port: PORT,
  });
});

/** Auth endpoints: /signup, /login, /verify-otp, /resend-otp */
app.use('/', authRoutes);

// ---------------------------------------------------------------------------
// Error handling (order matters — 404 before global error handler)
// ---------------------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Server startup with database connectivity check
// ---------------------------------------------------------------------------

async function start(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('[auth-service] Connected to MySQL (fireguard_ltd)');
  } catch (error) {
    console.error('[auth-service] Failed to connect to MySQL:', error);
    console.error('[auth-service] Start MySQL (XAMPP), then from repo root: npm run db:setup && npm run db:seed');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[auth-service] Running on http://localhost:${PORT}`);
    console.log(`[auth-service] Swagger docs: http://localhost:${PORT}/api-docs`);
  });
}

start();

export default app;
