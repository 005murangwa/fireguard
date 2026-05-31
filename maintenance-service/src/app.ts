/**
 * FireGuard LTD — Maintenance Service Entry Point
 *
 * PORT: 5005 (default)
 * DB:   fireguard_ltd.maintenance_records
 *
 * Responsibilities:
 * - CRUD for maintenance work orders (ADMIN)
 * - History by extinguisherCode
 * - POST /maintenance/:id/complete workflow
 * - Sync UNDER_MAINTENANCE / ACTIVE to fire-extinguisher-service
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './lib/prisma';
import maintenanceRoutes from './routes/maintenance.routes';
import internalRoutes from './routes/internal.routes';
import { setupSwagger } from './config/swagger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

setupSwagger(app);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'maintenance-service',
    port: PORT,
  });
});

app.use('/maintenance', maintenanceRoutes);

/** Service-to-service endpoints (notification cron, reporting aggregator) */
app.use('/internal', internalRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' });
});

async function start(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('[maintenance-service] Connected to MySQL (fireguard_ltd)');
  } catch (error) {
    console.error('[maintenance-service] Database connection failed:', error);
    console.error('Ensure XAMPP MySQL is running, then: npm run db:setup');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Maintenance service running on http://localhost:${PORT}`);
    console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
  });
}

start();

export default app;
