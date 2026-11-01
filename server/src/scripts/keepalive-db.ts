/**
 * Standalone Keep-Alive Script for Aiven PostgreSQL.
 *
 * Can be run independently via:
 *   npm run db:keepalive
 * or
 *   node dist/scripts/keepalive-db.js
 *
 * Keeps Aiven database active and prevents idle shutdown by executing
 * periodic heartbeat queries (`SELECT 1`).
 */

import '../env.js';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[DB Keepalive Script] Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const cleanConnectionString = connectionString.replace(/[?&]sslmode=[^&]+/gi, '');

const intervalSeconds = process.env.INTERVAL_SECONDS
  ? parseInt(process.env.INTERVAL_SECONDS, 10)
  : 120; // 2 minutes default

const pool = new pg.Pool({
  connectionString: cleanConnectionString,
  ssl: { rejectUnauthorized: false },
  max: 2,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[DB Keepalive Script] Pool error:', err.message);
});

let pingCount = 0;

async function ping() {
  const start = Date.now();
  pingCount++;
  try {
    const res = await pool.query('SELECT 1 AS keepalive, NOW() AS db_time, version() AS version');
    const elapsed = Date.now() - start;
    const dbTime = res.rows[0]?.db_time?.toISOString?.() ?? res.rows[0]?.db_time;
    console.log(`[${new Date().toISOString()}] Ping #${pingCount}: SUCCESS in ${elapsed}ms | Aiven DB Time: ${dbTime}`);
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}] Ping #${pingCount}: FAILED:`, err.message);
  }
}

console.log(`=======================================================`);
console.log(`  Aiven PostgreSQL Database Keep-Alive Script`);
console.log(`  Ping Interval: every ${intervalSeconds} seconds`);
console.log(`=======================================================`);

// Initial ping
await ping();

// Schedule recurring ping
const timer = setInterval(ping, intervalSeconds * 1000);

const shutdown = async () => {
  console.log('\nShutting down DB keep-alive script...');
  clearInterval(timer);
  await pool.end();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

