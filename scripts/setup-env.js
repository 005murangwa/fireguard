/**
 * Copies .env.example → .env for each FireGuard LTD microservice.
 * Run once during `npm run setup`.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const targets = [
  'api-gateway',
  'auth-service',
  'user-service',
  'fire-extinguisher-service',
  'inspection-service',
  'maintenance-service',
  'notification-service',
  'reporting-service',
];

for (const service of targets) {
  const examplePath = path.join(root, service, '.env.example');
  const envPath = path.join(root, service, '.env');

  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log(`Created ${service}/.env`);
  }
}

console.log('\nEnvironment files ready. Edit SMTP/JWT values if needed.');
