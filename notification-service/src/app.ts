/**
 * =============================================================================
 * FireGuard LTD — Notification Service Entry Point
 * =============================================================================
 * Express REST API + WebSocket server on a single HTTP port (5006).
 *
 * Features:
 *  - Dashboard notification CRUD
 *  - SMTP email delivery (nodemailer)
 *  - Real-time WebSocket push at /ws?token=<JWT>
 *  - Daily node-cron job for expiry / inspection / maintenance alerts
 * =============================================================================
 */

import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import notificationRoutes from './routes/notification.routes';
import { startCronJob } from './cron/notification.cron';
import { initWebSocketServer } from './services/websocket.service';
import prisma from './lib/prisma';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5006', 10);

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Health check — used by API gateway and Docker health probes
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'notification-service',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// REST routes mounted at /notifications
// ---------------------------------------------------------------------------
app.use('/notifications', notificationRoutes);

// ---------------------------------------------------------------------------
// 404 catch-all
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ---------------------------------------------------------------------------
// Bootstrap: HTTP server + WebSocket + cron + database
// ---------------------------------------------------------------------------
async function start(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('[DB] Connected to MySQL (fireguard_ltd)');
  } catch (error) {
    console.error('[DB] Failed to connect:', error);
    console.error('Start XAMPP MySQL, then run: npm run db:setup');
    process.exit(1);
  }

  // Create shared HTTP server (Express + WebSocket on same port)
  const server = http.createServer(app);

  // WebSocket hub at path /ws
  const wss = new WebSocketServer({ server, path: '/ws' });
  initWebSocketServer(wss);

  server.listen(PORT, () => {
    console.log(`Notification service running on http://localhost:${PORT}`);
    console.log(`WebSocket hub available at ws://localhost:${PORT}/ws?token=<JWT>`);
    startCronJob();
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use`);
    } else {
      console.error('Server failed to start:', error.message);
    }
    process.exit(1);
  });
}

start();

export default app;
