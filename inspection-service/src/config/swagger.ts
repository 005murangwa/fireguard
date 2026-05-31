/**
 * OpenAPI / Swagger Configuration — Inspection Service
 *
 * WHAT: Generates OpenAPI 3.0 spec from JSDoc annotations in route files.
 * WHY:  Interactive API docs at GET /api-docs for developers and QA.
 * HOW:  Import setupSwagger(app) in app.ts before route mounting.
 */
import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const port = process.env.PORT || 5004;

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'FireGuard LTD — Inspection Service API',
    version: '1.0.0',
    description:
      'Microservice for recording fire extinguisher field inspections. ' +
      'Inspectors create/update their own records; ADMIN has full CRUD access. ' +
      'Status changes propagate to fire-extinguisher-service via internal HTTP.',
  },
  servers: [{ url: `http://localhost:${port}`, description: 'Local development' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT issued by auth-service (login endpoint)',
      },
    },
    schemas: {
      CreateInspection: {
        type: 'object',
        required: [
          'extinguisherCode',
          'inspectionDate',
          'condition',
          'nextInspectionDate',
        ],
        properties: {
          extinguisherCode: { type: 'string', example: 'FE-2024-001' },
          inspectionDate: { type: 'string', format: 'date-time' },
          condition: {
            type: 'string',
            enum: [
              'EXCELLENT',
              'GOOD',
              'FAIR',
              'POOR',
              'FAILED',
              'REQUIRES_MAINTENANCE',
            ],
          },
          remarks: { type: 'string', nullable: true },
          nextInspectionDate: { type: 'string', format: 'date-time' },
        },
      },
      UpdateInspection: {
        type: 'object',
        properties: {
          extinguisherCode: { type: 'string' },
          inspectionDate: { type: 'string', format: 'date-time' },
          condition: { type: 'string' },
          remarks: { type: 'string' },
          nextInspectionDate: { type: 'string', format: 'date-time' },
        },
      },
      Inspection: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          extinguisherCode: { type: 'string' },
          inspectorId: { type: 'integer' },
          inspectionDate: { type: 'string', format: 'date-time' },
          condition: { type: 'string' },
          remarks: { type: 'string', nullable: true },
          nextInspectionDate: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  tags: [
    { name: 'Inspections', description: 'Extinguisher inspection CRUD' },
    { name: 'Internal', description: 'Service-to-service endpoints (no JWT)' },
  ],
};

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

/** Mount Swagger UI at /api-docs */
export function setupSwagger(app: Express): void {
  const spec = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
  app.get('/api-docs.json', (_req, res) => {
    res.json(spec);
  });
}
