import { AsyncLocalStorage } from 'async_hooks';
import pg from 'pg';

const als = new AsyncLocalStorage<pg.PoolClient>();

export class PostgresWrapper {
  public pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString });
  }

  /**
   * Convert SQLite `?` bind parameters to Postgres `$1, $2` parameters
   */
  private convertSql(sql: string): string {
    let count = 1;
    // Replace all '?' that are NOT inside quotes, though a simple regex might suffice 
    // for this codebase given standard prepared statements.
    return sql.replace(/\?/g, () => `$${count++}`);
  }

  private async executeQuery(sql: string, params: any[]) {
    // Check if we are inside a transaction context
    const client = als.getStore();
    if (client) {
      return await client.query(sql, params);
    }
    // Otherwise use the pool directly
    return await this.pool.query(sql, params);
  }

  prepare(sql: string) {
    const convertedSql = this.convertSql(sql);
    const self = this;

    return {
      async run(...args: any[]) {
        // Flatten args if passed as an array (common in SQLite wrappers)
        const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        const res = await self.executeQuery(convertedSql, params);
        // SQLite returns an object with `changes`. Postgres returns rowCount.
        return { changes: res.rowCount || 0, lastInsertRowid: null };
      },
      async get(...args: any[]) {
        const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        const res = await self.executeQuery(convertedSql, params);
        return res.rows[0];
      },
      async all(...args: any[]) {
        const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        const res = await self.executeQuery(convertedSql, params);
        return res.rows;
      }
    };
  }

  async exec(sql: string) {
    // Exec runs raw SQL without parameters
    await this.executeQuery(sql, []);
  }

  pragma(pragmaStr: string) {
    // No-op for Postgres. SQLite pragmas (WAL, foreign_keys) don't apply directly.
  }

  /**
   * Wraps an asynchronous function inside a PostgreSQL transaction.
   * Uses AsyncLocalStorage to ensure all prepared statements inside `fn`
   * automatically use the same PoolClient.
   */
  transaction(fn: (...args: any[]) => Promise<any>) {
    const self = this;
    return async function (...args: any[]) {
      const client = await self.pool.connect();
      try {
        await client.query('BEGIN');
        return await als.run(client, async () => {
          const result = await fn(...args);
          await client.query('COMMIT');
          return result;
        });
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    };
  }
}
