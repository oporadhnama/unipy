/**
 * PostgreSQL wrapper that mimics the better-sqlite3 API surface.
 *
 * better-sqlite3 exposes synchronous `.prepare().run/get/all()` and `.transaction()`.
 * This wrapper uses `pg` (node-postgres) and exposes the same method names, but
 * every terminal method (run, get, all) returns a Promise.
 *
 * SQL translation handled automatically:
 *   - `?` positional params → `$1, $2, ...`
 *   - `PRAGMA table_info(X)` → information_schema query
 *   - `INSERT OR IGNORE` → `INSERT ... ON CONFLICT DO NOTHING`
 *   - `AUTOINCREMENT` stripped (SERIAL handles it)
 */

import pg from 'pg';
import { AsyncLocalStorage } from 'node:async_hooks';

// AsyncLocalStorage carries the active PoolClient during a transaction so
// that nested prepare() calls automatically route through the same client.
const txStore = new AsyncLocalStorage<pg.PoolClient>();

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert SQLite `?` placeholders to PostgreSQL `$N` numbered params. */
function convertParams(sql: string): string {
  let idx = 0;
  return sql.replace(/\?/g, () => `$${++idx}`);
}

/** Translate SQLite-specific SQL constructs to PostgreSQL equivalents. */
function translateSql(raw: string): string {
  let sql = raw;

  // PRAGMA table_info(tablename) → information_schema query
  const pragmaMatch = sql.match(/^\s*PRAGMA\s+table_info\((\w+)\)/i);
  if (pragmaMatch) {
    return `SELECT column_name AS name FROM information_schema.columns WHERE table_name = '${pragmaMatch[1]}'`;
  }

  // INSERT OR IGNORE → INSERT ... ON CONFLICT DO NOTHING
  if (/INSERT\s+OR\s+IGNORE/i.test(sql)) {
    sql = sql.replace(/INSERT\s+OR\s+IGNORE/gi, 'INSERT');
    sql = sql.trimEnd().replace(/;?\s*$/, ' ON CONFLICT DO NOTHING');
  }

  // Convert ? → $N
  sql = convertParams(sql);

  return sql;
}

/** Translate a multi-statement DDL block (used by db.exec). */
function translateDdl(raw: string): string {
  let sql = raw;

  // INTEGER PRIMARY KEY AUTOINCREMENT → SERIAL PRIMARY KEY
  sql = sql.replace(/INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');

  // datetime('now') → NOW()::TEXT  (keeps column as TEXT for compatibility)
  sql = sql.replace(/\(datetime\('now'\)\)/gi, "NOW()::TEXT");
  sql = sql.replace(/datetime\('now'\)/gi, "NOW()::TEXT");

  return sql;
}

// ── PgStatement ──────────────────────────────────────────────────────────────

export class PgStatement {
  constructor(
    private pool: pg.Pool,
    private sql: string,
  ) {}

  /** Get the active executor: transaction client if inside a transaction, pool otherwise. */
  private executor(): pg.Pool | pg.PoolClient {
    return txStore.getStore() ?? this.pool;
  }

  /** Execute a write/mutation query. Returns { changes }. */
  async run(...params: any[]): Promise<{ changes: number; lastInsertRowid?: number }> {
    const result = await this.executor().query(this.sql, params);
    let lastId;
    if (result.rows && result.rows.length > 0 && result.rows[0].id !== undefined) {
      lastId = result.rows[0].id;
    }
    return { changes: result.rowCount ?? 0, lastInsertRowid: lastId };
  }

  /** Fetch a single row or undefined. */
  async get(...params: any[]): Promise<any> {
    const result = await this.executor().query(this.sql, params);
    return result.rows[0];
  }

  /** Fetch all matching rows. */
  async all(...params: any[]): Promise<any[]> {
    const result = await this.executor().query(this.sql, params);
    return result.rows;
  }
}

// ── PgDatabase ───────────────────────────────────────────────────────────────

export class PgDatabase {
  pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
    });
  }

  /** Prepare a statement (translates SQL automatically). */
  prepare(sql: string): PgStatement {
    return new PgStatement(this.pool, translateSql(sql));
  }

  /** Execute raw multi-statement DDL/SQL (no params). */
  async exec(sql: string): Promise<void> {
    await this.pool.query(translateDdl(sql));
  }

  /**
   * Wrap a function in a PostgreSQL transaction.
   * Returns an async callable that, when invoked, runs `fn` inside
   * BEGIN / COMMIT (with ROLLBACK on error).
   *
   * All `prepare()` calls inside `fn` automatically use the same PoolClient
   * via AsyncLocalStorage.
   */
  transaction<T>(fn: (...args: any[]) => T | Promise<T>): (...args: any[]) => Promise<T> {
    const self = this;
    return async (...args: any[]): Promise<T> => {
      const client = await self.pool.connect();
      try {
        await client.query('BEGIN');
        const result = await txStore.run(client, () => fn(...args));
        await client.query('COMMIT');
        return result as T;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    };
  }

  /** No-op — PostgreSQL doesn't use SQLite pragmas. */
  pragma(_value: string): void {
    // intentionally empty
  }

  /** Gracefully shut down the connection pool. */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
