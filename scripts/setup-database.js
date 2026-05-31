const fs = require('fs');
const path = require('path');

// Load root .env if present
const rootEnv = path.join(__dirname, '..', '.env');
if (fs.existsSync(rootEnv)) {
  require('dotenv').config({ path: rootEnv });
}

const mysql = require('mysql2/promise');

async function main() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  const sqlPath = path.join(__dirname, '..', 'database', 'init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log(`Connecting to MySQL at ${host}:${port} as ${user}...`);

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  });

  try {
    await connection.query(sql);
    console.log('Database fireguard_ltd is ready.');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Database setup failed:', error.message);
  console.error('');
  console.error('Make sure MySQL is running (XAMPP Control Panel -> Start MySQL).');
  process.exit(1);
});
