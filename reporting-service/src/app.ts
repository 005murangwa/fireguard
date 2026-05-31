/**
 * =============================================================================
 * FireGuard LTD — Reporting Service Entry Point
 * =============================================================================
 * ADMIN-only PDF report generation service on port 5007.
 *
 * Features:
 *  - PDF reports via pdfkit (expired, upcoming, inspection, maintenance, stats)
 *  - Data aggregation from upstream microservices via HTTP
 *  - Swagger UI at /api-docs
 * =============================================================================
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import reportRoutes from './routes/report.routes';
import { swaggerSpec } from './config/swagger';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5007', 10);

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Swagger API documentation (public — describes ADMIN-protected endpoints)
// ---------------------------------------------------------------------------
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (_req, res) => {
  res.json(swaggerSpec);
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Service health check
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is running
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'reporting-service',
    port: PORT,
    docs: `http://localhost:${PORT}/api-docs`,
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// Report routes — all ADMIN-only (enforced in report.routes.ts)
// ---------------------------------------------------------------------------
app.use('/reports', reportRoutes);

// ---------------------------------------------------------------------------
// 404 catch-all
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Reporting service running on http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
}).on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Reporting service failed to start:', error.message);
  }
  process.exit(1);
});

export default app;
