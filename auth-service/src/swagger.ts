/**
 * =============================================================================
 * FireGuard LTD — Swagger / OpenAPI Configuration
 * =============================================================================
 * WHAT:  Builds OpenAPI 3.0 spec and mounts Swagger UI at /api-docs.
 * WHY:  Interactive API documentation helps frontend and QA test auth flows
 *        (signup → verify-otp → login) without reading source code.
 * HOW:   swagger-jsdoc scans JSDoc @openapi blocks; swagger-ui-express serves UI.
 * =============================================================================
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

/** Base OpenAPI document metadata for FireGuard LTD auth service. */
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'FireGuard LTD — Auth Service API',
    version: '1.0.0',
    description:
      'Authentication microservice for FireGuard LTD. Handles signup, OTP email verification, and JWT-based login. Unverified users cannot log in until /verify-otp succeeds.',
    contact: {
      name: 'FireGuard LTD',
    },
  },
  servers: [
    {
      url: 'http://localhost:5001',
      description: 'Local development (direct)',
    },
    {
      url: 'http://localhost:5000/api/auth',
      description: 'Via API Gateway',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT returned from /login or /verify-otp',
      },
    },
    schemas: {
      SignupRequest: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'phoneNumber', 'password'],
        properties: {
          firstName: { type: 'string', example: 'Jane' },
          lastName: { type: 'string', example: 'Doe' },
          email: { type: 'string', format: 'email', example: 'jane@example.com' },
          phoneNumber: { type: 'string', example: '+250780123456' },
          password: { type: 'string', format: 'password', example: 'Admin123!' },
          role: { type: 'string', enum: ['ADMIN', 'INSPECTOR', 'CLIENT'], default: 'CLIENT' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'client@fireguard.com' },
          password: { type: 'string', format: 'password', example: 'Admin123!' },
        },
      },
      VerifyOtpRequest: {
        type: 'object',
        required: ['email', 'otpCode'],
        properties: {
          email: { type: 'string', format: 'email' },
          otpCode: { type: 'string', minLength: 6, maxLength: 6, example: '123456' },
        },
      },
      ResendOtpRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string' },
          phoneNumber: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'INSPECTOR', 'CLIENT'] },
          isVerified: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          token: { type: 'string' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      SignupSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          email: { type: 'string' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
          details: { type: 'array', items: { type: 'object' } },
        },
      },
    },
  },
  paths: {
    '/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new account',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SignupRequest' } },
          },
        },
        responses: {
          201: {
            description: 'Account created; OTP emailed',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SignupSuccessResponse' } },
            },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login (requires verified email)',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } },
          },
        },
        responses: {
          200: {
            description: 'JWT issued',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthSuccessResponse' } },
            },
          },
          401: { description: 'Invalid credentials or unverified account' },
        },
      },
    },
    '/verify-otp': {
      post: {
        tags: ['Auth'],
        summary: 'Verify email with 6-digit OTP',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/VerifyOtpRequest' } },
          },
        },
        responses: {
          200: {
            description: 'Email verified; JWT issued',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthSuccessResponse' } },
            },
          },
          400: { description: 'Invalid or expired OTP' },
        },
      },
    },
    '/resend-otp': {
      post: {
        tags: ['Auth'],
        summary: 'Resend verification OTP',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ResendOtpRequest' } },
          },
        },
        responses: {
          200: { description: 'New OTP sent' },
          404: { description: 'Account not found' },
        },
      },
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Service health check',
        responses: {
          200: { description: 'Service is running' },
        },
      },
    },
  },
};

/** swagger-jsdoc options — also scans route files for @openapi JSDoc blocks. */
const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

/** Compiled OpenAPI specification object. */
export const swaggerSpec = swaggerJsdoc(options);

/**
 * Mount Swagger UI middleware on the Express app at /api-docs.
 *
 * @param app - Express application instance from app.ts
 */
export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'FireGuard LTD Auth API',
    swaggerOptions: {
      persistAuthorization: true,
    },
  }));

  // Raw JSON spec for tooling / Postman import
  app.get('/api-docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });
}
