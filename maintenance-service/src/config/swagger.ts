/**
 * OpenAPI / Swagger Configuration — Maintenance Service
 */
import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const port = process.env.PORT || 5005;

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'FireGuard LTD — Maintenance Service API',
    version: '1.0.0',
    description:
      'Microservice for scheduling and tracking fire extinguisher maintenance. ' +
      'ADMIN manages all work orders. Scheduling sets extinguisher status to UNDER_MAINTENANCE ' +
      'via fire-extinguisher-service internal API.',
  },
  servers: [{ url: `http://localhost:${port}`, description: 'Local development' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      CreateMaintenance: {
        type: 'object',
        required: ['extinguisherCode', 'maintenanceDate', 'description', 'technician'],
        properties: {
          extinguisherCode: { type: 'string', example: 'FE-2024-001' },
          maintenanceDate: { type: 'string', format: 'date-time' },
          description: { type: 'string' },
          technician: { type: 'string', example: 'John Smith' },
          status: {
            type: 'string',
            enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
            default: 'SCHEDULED',
          },
        },
      },
      UpdateMaintenance: {
        type: 'object',
        properties: {
          extinguisherCode: { type: 'string' },
          maintenanceDate: { type: 'string', format: 'date-time' },
          description: { type: 'string' },
          technician: { type: 'string' },
          status: {
            type: 'string',
            enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
          },
        },
      },
      CompleteMaintenance: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'Optional completion notes' },
          maintenanceDate: {
            type: 'string',
            format: 'date-time',
            description: 'Actual completion date (defaults to existing)',
          },
        },
      },
      MaintenanceRecord: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          extinguisherCode: { type: 'string' },
          maintenanceDate: { type: 'string', format: 'date-time' },
          description: { type: 'string' },
          technician: { type: 'string' },
          status: {
            type: 'string',
            enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  tags: [
    { name: 'Maintenance', description: 'Maintenance work order CRUD' },
    { name: 'Internal', description: 'Service-to-service endpoints (no JWT)' },
  ],
};

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

export function setupSwagger(app: Express): void {
  const spec = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
  app.get('/api-docs.json', (_req, res) => {
    res.json(spec);
  });
}
