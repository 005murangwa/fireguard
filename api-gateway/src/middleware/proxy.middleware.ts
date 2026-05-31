/**
 * Reverse-proxy configuration for all FireGuard LTD microservices.
 * pathRewrite maps gateway paths (/api/users/...) to service-internal paths (/users/...).
 */
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { Response } from 'express';

const AUTH = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const USER = process.env.USER_SERVICE_URL || 'http://localhost:5002';
const EXT = process.env.FIRE_EXTINGUISHER_SERVICE_URL || 'http://localhost:5003';
const INSP = process.env.INSPECTION_SERVICE_URL || 'http://localhost:5004';
const MAINT = process.env.MAINTENANCE_SERVICE_URL || 'http://localhost:5005';
const NOTIFY = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5006';
const ORDER = process.env.ORDER_SERVICE_URL || 'http://localhost:5008';

function createProxy(target: string, rewrite: (path: string) => string) {
  const options: Options = {
    target,
    changeOrigin: true,
    pathRewrite: (path) => rewrite(path),
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.headers.authorization) {
          proxyReq.setHeader('Authorization', req.headers.authorization);
        }
      },
      error: (err, _req, res) => {
        console.error('Proxy error:', err.message);
        if (res && 'writeHead' in res) {
          (res as Response).status(502).json({ error: 'Service unavailable' });
        }
      },
    },
  };
  return createProxyMiddleware(options);
}

export const authProxy = createProxy(AUTH, (p) => p || '/');
export const userProxy = createProxy(USER, (p) => `/users${p}`);
export const extinguisherProxy = createProxy(EXT, (p) => `/extinguishers${p}`);
export const inspectionProxy = createProxy(INSP, (p) => `/inspections${p}`);
export const maintenanceProxy = createProxy(MAINT, (p) => `/maintenance${p}`);
export const notificationProxy = createProxy(NOTIFY, (p) => `/notifications${p}`);
export const reportingProxy = createProxy(REPORT, (p) => `/reports${p}`);
export const orderProxy = createProxy(ORDER, (p) => `/orders${p}`);
