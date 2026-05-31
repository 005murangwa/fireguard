/**
 * =============================================================================
 * FireGuard LTD — WebSocket Real-Time Notification Hub
 * =============================================================================
 * Maintains authenticated WebSocket connections keyed by userId.
 * When a new dashboard notification is created, connected clients receive
 * an instant JSON push without polling the REST API.
 *
 * Connection URL: ws://localhost:5006/ws?token=<JWT>
 * =============================================================================
 */

import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { verifyToken } from '../middleware/auth.middleware';

/** Shape of payload pushed to connected clients. */
export interface RealtimeNotificationPayload {
  id: number;
  userId: number;
  title: string;
  message: string;
  notificationType: string;
  isRead: boolean;
  createdAt: string;
}

/** userId → Set of open WebSocket connections (multi-tab support). */
const connectionsByUser = new Map<number, Set<WebSocket>>();

/**
 * Register WebSocket server handlers on the shared HTTP server.
 * Called once during app bootstrap in app.ts.
 */
export function initWebSocketServer(wss: WebSocketServer): void {
  wss.on('connection', (socket: WebSocket, request: IncomingMessage) => {
    // Extract JWT from query string: /ws?token=eyJ...
    const url = new URL(request.url || '', 'http://localhost');
    const token = url.searchParams.get('token');

    if (!token) {
      socket.close(4001, 'Authentication token required');
      return;
    }

    const user = verifyToken(token);
    if (!user) {
      socket.close(4003, 'Invalid or expired token');
      return;
    }

    // Track this socket under the authenticated userId
    if (!connectionsByUser.has(user.userId)) {
      connectionsByUser.set(user.userId, new Set());
    }
    connectionsByUser.get(user.userId)!.add(socket);

    console.log(`[WebSocket] User ${user.userId} connected (${connectionsByUser.get(user.userId)!.size} tab(s))`);

    // Heartbeat ping every 30s to detect stale connections
    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.ping();
      }
    }, 30_000);

    socket.on('close', () => {
      clearInterval(pingInterval);
      const userSockets = connectionsByUser.get(user.userId);
      if (userSockets) {
        userSockets.delete(socket);
        if (userSockets.size === 0) {
          connectionsByUser.delete(user.userId);
        }
      }
      console.log(`[WebSocket] User ${user.userId} disconnected`);
    });

    socket.on('error', (error) => {
      console.error(`[WebSocket] Error for user ${user.userId}:`, error.message);
    });

    // Acknowledge successful connection
    socket.send(JSON.stringify({ type: 'connected', userId: user.userId }));
  });

  console.log('[WebSocket] Real-time notification hub ready at /ws');
}

/**
 * Push a notification payload to all open WebSocket tabs for a user.
 * Silently no-ops when the user has no active connections.
 */
export function broadcastToUser(userId: number, payload: RealtimeNotificationPayload): void {
  const sockets = connectionsByUser.get(userId);
  if (!sockets || sockets.size === 0) {
    return;
  }

  const message = JSON.stringify({ type: 'notification', data: payload });

  for (const socket of sockets) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  }
}

/** Return count of currently connected users (for health/debug). */
export function getConnectedUserCount(): number {
  return connectionsByUser.size;
}
