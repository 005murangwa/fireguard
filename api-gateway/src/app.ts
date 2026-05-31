/**
 * FireGuard LTD - API Gateway
 *
 * WHAT: Single entry point (port 5000) for the React frontend and external clients.
 * WHY:  Microservices pattern — clients never call individual services directly.
 * HOW:  JWT validation on protected routes, then HTTP proxy to each service.
 */
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { jwtMiddleware } from './middleware/jwt.middleware';
import { errorHandler } from './middleware/error.middleware';
import {
  authProxy,
  userProxy,
  extinguisherProxy,
  inspectionProxy,
  maintenanceProxy,
  notificationProxy,
  reportingProxy,
} from './middleware/proxy.middleware';
import { swaggerDocument } from './swagger';
import { getDashboardStats } from './controllers/dashboard.controller';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/** Security headers + CORS for browser frontend (XSS mitigation layer). */
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));

/** Aggregated Swagger UI — documents gateway-visible routes. */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', company: 'FireGuard LTD', port: PORT });
});

/** Public auth routes (signup, login, OTP) — no JWT required. */
app.use('/api/auth', authProxy);

/** Protected microservice proxies — JWT validated before forwarding. */
app.use('/api/users', jwtMiddleware, userProxy);
app.use('/api/extinguishers', jwtMiddleware, extinguisherProxy);
app.use('/api/inspections', jwtMiddleware, inspectionProxy);
app.use('/api/maintenance', jwtMiddleware, maintenanceProxy);
app.use('/api/notifications', jwtMiddleware, notificationProxy);
app.use('/api/reports', jwtMiddleware, reportingProxy);

/** Admin dashboard aggregate stats. */
app.get('/api/dashboard/stats', jwtMiddleware, getDashboardStats);

/** Global error handler — consistent JSON errors for the frontend. */
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`FireGuard LTD API Gateway running on http://localhost:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
});

export default app;
