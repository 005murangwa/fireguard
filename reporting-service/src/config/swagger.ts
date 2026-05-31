/**
 * =============================================================================
 * FireGuard LTD — Swagger / OpenAPI Configuration
 * =============================================================================
 * Serves interactive API docs at GET /api-docs.
 * All report endpoints require ADMIN JWT (documented in security scheme).
 * =============================================================================
 */

import swaggerJsdoc from 'swagger-jsdoc';

/** OpenAPI 3.0 specification generated from JSDoc annotations in route files. */
export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FireGuard LTD — Reporting Service API',
      version: '1.0.0',
      description:
        'ADMIN-only PDF report generation. Aggregates data from fire-extinguisher, ' +
        'inspection, maintenance, notification, and user microservices.',
    },
    servers: [{ url: 'http://localhost:5007', description: 'Local development' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from auth-service login (ADMIN role required)',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Reports', description: 'PDF report downloads (ADMIN only)' },
      { name: 'Health', description: 'Service health check' },
    ],
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
});
