/**
 * @freelang/database-driver - SQLiteDatabase
 * Main SQLite driver class using better-sqlite3
 */

import Database from 'better-sqlite3';
import { IDatabase, RunResult, Transaction, SQLiteOptions } from './types';
import { SQLitePool } from './pool';

/**
 * SQLiteDatabase - Main driver class
 * Supports synchronous operations, transactions, and connection pooling
 */
export class SQLiteDatabase implements IDatabase {
  private db: Database.Database;
  private pool?: SQLitePool;
  private usePool: boolean;
  private isOpen: boolean = true;

  constructor(filePath: string, options?: Partial<SQLiteOptions>) {
    const opts: SQLiteOptions = {
      filePath,
      cacheSize: 10000,
      mmapSize: 268435456,
      synchronous: 'NORMAL',
      journalMode: 'WAL',
      busyTimeout: 5000,
      ...options,
    };

    // Determine if using pool or single connection
    this.usePool = opts.filePath !== ':memory:' && !(opts.memory === true);

    if (this.usePool) {
      // Create pool with 5 connections
      this.pool = new SQLitePool(opts.filePath, 5, opts);
      // Get one connection synchronously
      this.db = new Database(opts.filePath, {
        readonly: opts.readonly || false,
        timeout: opts.busyTimeout || 5000,
      });
    } else {
      // Single connection (in-memory or special case)
      this.db = new Database(opts.filePath || ':memory:', {
        readonly: opts.readonly || false,
        timeout: opts.busyTimeout || 5000,
      });
    }

    // Configure pragmas
    this.db.pragma(`cache_size = ${opts.cacheSize || 10000}`);
    this.db.pragma(`mmap_size = ${opts.mmapSize || 268435456}`);
    this.db.pragma(`synchronous = ${opts.synchronous || 'NORMAL'}`);
    this.db.pragma(`journal_mode = ${opts.journalMode || 'WAL'}`);
    this.db.pragma('busy_timeout = 5000');
  }

  /**
   * Execute SELECT query and return all rows
   */
  query<T = unknown>(sql: string, params?: unknown[]): T[] {
    if (!this.isOpen) throw new Error('Database is closed');

    try {
      const stmt = this.db.prepare(sql);
      if (params && params.length > 0) {
        return stmt.all(...params) as T[];
      }
      return stmt.all() as T[];
    } catch (error) {
      throw new Error(`Query failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute SELECT query and return first row
   */
  get<T = unknown>(sql: string, params?: unknown[]): T | undefined {
    if (!this.isOpen) throw new Error('Database is closed');

    try {
      const stmt = this.db.prepare(sql);
      if (params && params.length > 0) {
        return stmt.get(...params) as T | undefined;
      }
      return stmt.get() as T | undefined;
    } catch (error) {
      throw new Error(`Get failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute INSERT/UPDATE/DELETE query
   */
  run(sql: string, params?: unknown[]): RunResult {
    if (!this.isOpen) throw new Error('Database is closed');

    try {
      const stmt = this.db.prepare(sql);
      let result: Database.RunResult;

      if (params && params.length > 0) {
        result = stmt.run(...params);
      } else {
        result = stmt.run();
      }

      return {
        changes: result.changes,
        lastInsertRowid: result.lastInsertRowid,
      };
    } catch (error) {
      throw new Error(`Run failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute a transaction
   */
  transaction<T>(fn: (tx: Transaction) => T): T {
    if (!this.isOpen) throw new Error('Database is closed');

    const transactionFn = this.db.transaction((tx: Transaction) => {
      return fn(tx);
    });

    return transactionFn({
      query: <T = unknown>(sql: string, params?: unknown[]): T[] => this.query<T>(sql, params),
      get: <T = unknown>(sql: string, params?: unknown[]): T | undefined => this.get<T>(sql, params),
      run: (sql: string, params?: unknown[]): RunResult => this.run(sql, params),
    });
  }

  /**
   * Create a table if it doesn't exist
   */
  createTable(
    tableName: string,
    columns: Record<string, string>
  ): void {
    if (!this.isOpen) throw new Error('Database is closed');

    const columnDefs = Object.entries(columns)
      .map(([name, type]) => `${name} ${type}`)
      .join(', ');

    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefs})`;
    this.run(sql);
  }

  /**
   * Drop a table
   */
  dropTable(tableName: string): void {
    if (!this.isOpen) throw new Error('Database is closed');
    this.run(`DROP TABLE IF EXISTS ${tableName}`);
  }

  /**
   * Check if table exists
   */
  tableExists(tableName: string): boolean {
    if (!this.isOpen) throw new Error('Database is closed');

    const result = this.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?`,
      [tableName]
    );

    return (result?.count ?? 0) > 0;
  }

  /**
   * Get all tables
   */
  getTables(): string[] {
    if (!this.isOpen) throw new Error('Database is closed');

    const result = this.query<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
    );

    return result.map(row => row.name);
  }

  /**
   * Vacuum the database
   */
  vacuum(): void {
    if (!this.isOpen) throw new Error('Database is closed');
    this.run('VACUUM');
  }

  /**
   * Get database statistics
   */
  stats(): {
    tables: number;
    pages: number;
    cacheSize: number;
    journalMode: string;
  } {
    if (!this.isOpen) throw new Error('Database is closed');

    const tables = this.getTables().length;
    const pageCount = (this.db.pragma('page_count') as number[])[0] || 0;
    const cacheSize = (this.db.pragma('cache_size') as number[])[0] || 0;
    const journalMode = ((this.db.pragma('journal_mode') as string[])[0] || 'OFF').toUpperCase();

    return {
      tables,
      pages: pageCount,
      cacheSize,
      journalMode,
    };
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.isOpen) {
      this.db.close();
      if (this.pool) {
        this.pool.close();
      }
      this.isOpen = false;
    }
  }

  /**
   * Check if database is open
   */
  isClosed(): boolean {
    return !this.isOpen;
  }
}
