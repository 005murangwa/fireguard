/**
 * =============================================================================
 * FireGuard LTD - Fire Extinguisher Service OpenAPI / Swagger Configuration
 * =============================================================================
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const PORT = process.env.PORT || 5003;

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'FireGuard LTD - Fire Extinguisher Service API',
    version: '1.0.0',
    description:
      'Microservice for fire extinguisher inventory management with QR code scanning. ' +
      'ADMIN has full CRUD; INSPECTOR and CLIENT have read-only access to assigned units.',
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
      },
    },
    schemas: {
      FireExtinguisher: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          extinguisherCode: { type: 'string', example: 'FG-ABC123-XY9Z' },
          type: { type: 'string', example: 'ABC Dry Powder' },
          manufacturer: { type: 'string', example: 'FireGuard Industries' },
          capacity: { type: 'string', example: '6kg' },
          installationLocation: { type: 'string', example: 'Building A - Floor 2' },
          manufacturingDate: { type: 'string', format: 'date-time' },
          expirationDate: { type: 'string', format: 'date-time' },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'EXPIRED', 'UNDER_MAINTENANCE', 'INSPECTION_DUE'],
          },
          assignedClientId: { type: 'integer', nullable: true },
          qrCodeData: { type: 'string', description: 'Base64 PNG data URL' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ScanResult: {
        type: 'object',
        properties: {
          extinguisherCode: { type: 'string' },
          type: { type: 'string' },
          installationLocation: { type: 'string' },
          status: { type: 'string' },
          expirationDate: { type: 'string', format: 'date-time' },
          assignedClientId: { type: 'integer', nullable: true },
        },
      },
    },
  },
  tags: [
    { name: 'Extinguishers', description: 'CRUD and list operations' },
    { name: 'Scan', description: 'QR code scan lookup' },
    { name: 'Internal', description: 'Service-to-service endpoints (no JWT)' },
  ],
};

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);

/**
 * Mounts Swagger UI at /api-docs on the Express app.
 */
export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });
}
