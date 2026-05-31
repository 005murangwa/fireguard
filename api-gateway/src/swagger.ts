/** FireGuard LTD API Gateway — Swagger overview document. */
export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'FireGuard LTD API Gateway',
    version: '1.0.0',
    description: 'Central gateway for all FireGuard LTD microservices. Authenticate via /api/auth then use Bearer JWT.',
  },
  servers: [{ url: 'http://localhost:5000', description: 'Local development' }],
  tags: [
    { name: 'Auth', description: 'Signup, Login, OTP (port 5001)' },
    { name: 'Users', description: 'User management (port 5002)' },
    { name: 'Extinguishers', description: 'Fire extinguisher CRUD + QR (port 5003)' },
    { name: 'Inspections', description: 'Inspection records (port 5004)' },
    { name: 'Maintenance', description: 'Maintenance records (port 5005)' },
    { name: 'Notifications', description: 'Email + dashboard alerts (port 5006)' },
    { name: 'Reports', description: 'PDF reports (port 5007)' },
  ],
  paths: {
    '/api/auth/signup': { post: { tags: ['Auth'], summary: 'Register new user (sends OTP email)' } },
    '/api/auth/login': { post: { tags: ['Auth'], summary: 'Login (requires verified email)' } },
    '/api/auth/verify-otp': { post: { tags: ['Auth'], summary: 'Verify email OTP' } },
    '/api/auth/resend-otp': { post: { tags: ['Auth'], summary: 'Resend OTP code' } },
    '/api/users': { get: { tags: ['Users'], summary: 'List users (ADMIN)' } },
    '/api/extinguishers': { get: { tags: ['Extinguishers'], summary: 'List extinguishers' } },
    '/api/inspections': { get: { tags: ['Inspections'], summary: 'List inspections' } },
    '/api/maintenance': { get: { tags: ['Maintenance'], summary: 'List maintenance records' } },
    '/api/notifications': { get: { tags: ['Notifications'], summary: 'List notifications' } },
    '/api/reports/statistics': { get: { tags: ['Reports'], summary: 'PDF system statistics (ADMIN)' } },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
};
