/**
 * @freelang/database-driver - PostgreSQL Driver
 * Based on AION-ts-orchestrator strategy-db.ts pattern
 * Async/await support with pg.Pool
 */

import { Pool, QueryResult } from 'pg';
import { IDatabaseAsync, RunResult, TransactionAsync, DBConfig } from './types';

/**
 * PostgreSQL Database Driver
 * Async query execution with connection pooling (implements IDatabaseAsync)
 */
export class PostgreSQLDatabase implements IDatabaseAsync {
  private pool: Pool;
  private isOpen: boolean = true;

  constructor(config: DBConfig) {
    if (!config.host || !config.port || !config.database) {
      throw new Error('PostgreSQL requires host, port, and database in config');
    }

    // Build connection string
    const connectionString = `postgresql://${config.user || 'postgres'}:${
      config.password || 'postgres'
    }@${config.host}:${config.port}/${config.database}${
      config.ssl ? '?sslmode=require' : ''
    }`;

    // Initialize pool (AION pattern: max 5 connections)
    this.pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30000, // 30 seconds
      connectionTimeoutMillis: 5000,
      statement_timeout: 60000, // 60 seconds
    });

    // Error handling
    this.pool.on('error', (err) => {
      console.error('[PostgreSQL] Pool error:', err);
    });
  }

  /**
   * Execute SELECT query and return all rows
   * AION pattern: async/await with $1, $2 placeholders
   */
  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    if (!this.isOpen) throw new Error('Database is closed');

    try {
      const result = await this.pool.query(sql, params || []);
      return result.rows as T[];
    } catch (error) {
      throw new Error(
        `PostgreSQL query failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Execute SELECT query and return first row
   * AION pattern: single row retrieval with LIMIT 1
   */
  async get<T = unknown>(sql: string, params?: unknown[]): Promise<T | undefined> {
    if (!this.isOpen) throw new Error('Database is closed');

    try {
      const result = await this.pool.query(sql, params || []);
      return result.rows.length > 0 ? (result.rows[0] as T) : undefined;
    } catch (error) {
      throw new Error(
        `PostgreSQL get failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Execute INSERT/UPDATE/DELETE query
   * AION pattern: returns changes count
   */
  async run(sql: string, params?: unknown[]): Promise<RunResult> {
    if (!this.isOpen) throw new Error('Database is closed');

    try {
      const result = await this.pool.query(sql, params || []);

      // Try to extract lastInsertRowid from RETURNING clause
      let lastInsertRowid: number | bigint = 0;
      if (result.rows.length > 0 && (result.rows[0] as any).id) {
        lastInsertRowid = (result.rows[0] as any).id;
      }

      return {
        changes: result.rowCount || 0,
        lastInsertRowid,
      };
    } catch (error) {
      throw new Error(
        `PostgreSQL run failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Execute a transaction
   * AION pattern: client.query within BEGIN/COMMIT
   */
  async transaction<T>(fn: (tx: TransactionAsync) => Promise<T>): Promise<T> {
    if (!this.isOpen) throw new Error('Database is closed');

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const transactionContext: TransactionAsync = {
        query: async <T = unknown>(sql: string, params?: unknown[]): Promise<T[]> => {
          const result = await client.query(sql, params || []);
          return result.rows as T[];
        },
        get: async <T = unknown>(
          sql: string,
          params?: unknown[]
        ): Promise<T | undefined> => {
          const result = await client.query(sql, params || []);
          return result.rows.length > 0 ? (result.rows[0] as T) : undefined;
        },
        run: async (sql: string, params?: unknown[]): Promise<RunResult> => {
          const result = await client.query(sql, params || []);
          return {
            changes: result.rowCount || 0,
            lastInsertRowid: (result.rows[0]?.id as number | bigint) || 0,
          };
        },
      };

      const result = await fn(transactionContext);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(
        `Transaction failed: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      client.release();
    }
  }

  /**
   * Create a table
   * PostgreSQL pattern: IF NOT EXISTS
   */
  async createTable(
    tableName: string,
    columns: Record<string, string>
  ): Promise<void> {
    if (!this.isOpen) throw new Error('Database is closed');

    const columnDefs = Object.entries(columns)
      .map(([name, type]) => `${name} ${type}`)
      .join(', ');

    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefs})`;
    await this.pool.query(sql);
  }

  /**
   * Drop a table
   */
  async dropTable(tableName: string): Promise<void> {
    if (!this.isOpen) throw new Error('Database is closed');
    await this.pool.query(`DROP TABLE IF EXISTS ${tableName}`);
  }

  /**
   * Check if table exists
   * PostgreSQL pattern: information_schema
   */
  async tableExists(tableName: string): Promise<boolean> {
    if (!this.isOpen) throw new Error('Database is closed');

    const result = await this.pool.query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = $1
      )`,
      [tableName]
    );

    return result.rows[0]?.exists || false;
  }

  /**
   * Get all tables
   */
  async getTables(): Promise<string[]> {
    if (!this.isOpen) throw new Error('Database is closed');

    const result = await this.pool.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );

    return result.rows.map(row => row.table_name);
  }

  /**
   * Execute a raw query (for complex operations)
   * AION pattern: used for JOIN, aggregate queries
   */
  async rawQuery<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    if (!this.isOpen) throw new Error('Database is closed');
    return this.query<T>(sql, params);
  }

  /**
   * Get database statistics
   * PostgreSQL pattern: pg_stat_user_tables
   */
  async stats(): Promise<{
    tables: number;
    totalRows: number;
    schemaSize: string;
  }> {
    if (!this.isOpen) throw new Error('Database is closed');

    const tables = await this.getTables();
    const rowCountResult = await this.pool.query<{ table_name: string; rows: number }>(
      `SELECT table_name, n_live_tup as rows
       FROM pg_stat_user_tables
       WHERE schemaname = 'public'`
    );

    const totalRows = rowCountResult.rows.reduce((sum, row) => sum + row.rows, 0);

    const sizeResult = await this.pool.query<{ size: string }>(
      `SELECT pg_size_pretty(pg_database_size(current_database())) as size`
    );

    return {
      tables: tables.length,
      totalRows,
      schemaSize: sizeResult.rows[0]?.size || '0 bytes',
    };
  }

  /**
   * Check database health
   */
  async health(): Promise<{ status: string; latency: number }> {
    if (!this.isOpen) throw new Error('Database is closed');

    const start = Date.now();
    try {
      await this.pool.query('SELECT 1');
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch {
      return { status: 'unhealthy', latency: Date.now() - start };
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.isOpen) {
      await this.pool.end();
      this.isOpen = false;
    }
  }

  /**
   * Check if database is closed
   */
  isClosed(): boolean {
    return !this.isOpen;
  }

  /**
   * Get pool statistics
   */
  poolStats(): {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  } {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }
}

/**
 * Helper function: Convert PostgreSQL camelCase to snake_case
 * Useful for RETURNING clauses with column aliases
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Helper function: Convert snake_case to camelCase
 * Useful for result row mapping
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
