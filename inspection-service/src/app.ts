/**
 * FireGuard LTD — Inspection Service Entry Point
 *
 * PORT: 5004 (default)
 * DB:   fireguard_ltd.inspections
 *
 * Responsibilities:
 * - CRUD for field inspection records
 * - History lookup by extinguisherCode
 * - Role-based access (INSPECTOR own records, ADMIN full access)
 * - Sync extinguisher status to fire-extinguisher-service on create/update
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './lib/prisma';
import inspectionRoutes from './routes/inspection.routes';
import internalRoutes from './routes/internal.routes';
import { setupSwagger } from './config/swagger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(express.json());

/** Interactive OpenAPI documentation */
setupSwagger(app);

/** Liveness probe for orchestrators / dev scripts */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'inspection-service',
    port: PORT,
  });
});

/** All inspection REST endpoints mounted at /inspections */
app.use('/inspections', inspectionRoutes);

/** Service-to-service endpoints (notification cron, reporting aggregator) */
app.use('/internal', internalRoutes);

/** Catch-all 404 handler */
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' });
});

async function start(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('[inspection-service] Connected to MySQL (fireguard_ltd)');
  } catch (error) {
    console.error('[inspection-service] Database connection failed:', error);
    console.error('Ensure XAMPP MySQL is running, then: npm run db:setup');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Inspection service running on http://localhost:${PORT}`);
    console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
  });
}

start();

export default app;
