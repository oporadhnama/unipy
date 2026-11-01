import { getDb } from '../db/index.js';

let intervalId: ReturnType<typeof setInterval> | null = null;
let consecutiveFailures = 0;
let totalPings = 0;

export interface PingResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
  timestamp: string;
}

/**
 * Executes a lightweight ping query directly to PostgreSQL.
 * Keeps the connection alive and verifies the database is responsive.
 */
export async function pingDatabase(timeoutMs = 5000): Promise<PingResult> {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  try {
    const db = getDb();
    
    // Use a Promise.race to enforce a timeout on the ping query
    const queryPromise = db.pool.query('SELECT 1 AS keepalive, NOW() AS server_time');
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Database keepalive ping timed out after ${timeoutMs}ms`)), timeoutMs)
    );

    await Promise.race([queryPromise, timeoutPromise]);
    const latencyMs = Date.now() - start;

    consecutiveFailures = 0;
    totalPings++;

    return {
      ok: true,
      latencyMs,
      timestamp,
    };
  } catch (err: any) {
    consecutiveFailures++;
    const latencyMs = Date.now() - start;
    const error = err?.message ?? String(err);

    return {
      ok: false,
      latencyMs,
      error,
      timestamp,
    };
  }
}

/**
 * Starts a periodic background keep-alive ping for the Aiven PostgreSQL database.
 * Default interval: 2 minutes (120,000 ms).
 * Aiven free-tier databases may sleep/power-off after periods of zero query activity.
 * This background heartbeat ensures active queries are sent continuously.
 */
export function startDbKeepalive(customIntervalMs?: number): void {
  if (intervalId) {
    return; // Already running
  }

  const envInterval = process.env.DB_KEEPALIVE_INTERVAL_MS
    ? parseInt(process.env.DB_KEEPALIVE_INTERVAL_MS, 10)
    : undefined;

  // Default to 2 minutes (120,000 ms), well below typical idle sleep thresholds
  const intervalMs = customIntervalMs ?? envInterval ?? 2 * 60 * 1000;
  const verbose = process.env.DB_KEEPALIVE_VERBOSE === 'true';

  console.log(`[DB Keepalive] Initializing Aiven database keep-alive heartbeat (every ${Math.round(intervalMs / 1000)}s)...`);

  // Run the first keepalive check shortly after startup
  setTimeout(async () => {
    const res = await pingDatabase();
    if (res.ok) {
      console.log(`[DB Keepalive] Initial Aiven DB ping successful (${res.latencyMs}ms)`);
    } else {
      console.warn(`[DB Keepalive] Initial Aiven DB ping failed: ${res.error}`);
    }
  }, 2000);

  intervalId = setInterval(async () => {
    const res = await pingDatabase();

    if (res.ok) {
      // Log periodically (every 10 pings ~ 20 minutes) or every time if verbose
      if (verbose || totalPings % 10 === 0) {
        console.log(`[DB Keepalive] Aiven DB heartbeat OK (${res.latencyMs}ms, total pings: ${totalPings})`);
      }
    } else {
      console.warn(`[DB Keepalive] Warning: DB heartbeat query failed (${consecutiveFailures} consecutive): ${res.error}`);
    }
  }, intervalMs);
}

/**
 * Stops the background database keep-alive ping.
 */
export function stopDbKeepalive(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[DB Keepalive] Heartbeat stopped.');
  }
}

