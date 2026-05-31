/**
 * =============================================================================
 * FireGuard LTD - User Service OpenAPI / Swagger Configuration
 * =============================================================================
 * WHAT: Generates OpenAPI 3.0 spec and serves Swagger UI at /api-docs.
 * WHY:  Documents admin-only endpoints for API consumers and academic review.
 * =============================================================================
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const PORT = process.env.PORT || 5002;

/** Base OpenAPI definition — extended by JSDoc comments in route files. */
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'FireGuard LTD - User Service API',
    version: '1.0.0',
    description:
      'Admin-only microservice for managing platform user accounts. ' +
      'All endpoints require a valid JWT with ADMIN role.',
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from auth-service login',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          firstName: { type: 'string', example: 'John' },
          lastName: { type: 'string', example: 'Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          phoneNumber: { type: 'string', example: '+1234567890' },
          role: { type: 'string', enum: ['ADMIN', 'INSPECTOR', 'CLIENT'] },
          isVerified: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      UserStats: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          admins: { type: 'integer' },
          inspectors: { type: 'integer' },
          clients: { type: 'integer' },
          verified: { type: 'integer' },
          unverified: { type: 'integer' },
          createdLast30Days: { type: 'integer' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
        },
      },
    },
  },
  tags: [
    {
      name: 'Users',
      description: 'Admin user management operations',
    },
  ],
};

/** Scan route files for @swagger JSDoc annotations. */
const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

/** Compiled OpenAPI specification object. */
export const swaggerSpec = swaggerJsdoc(options);

/**
 * Mounts Swagger UI middleware on the Express application.
 *
 * @param app - Express application instance
 */
export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });
}
