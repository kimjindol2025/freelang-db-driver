/**
 * @freelang/database-driver - Common Types
 * SQL operators and response interfaces
 */

/**
 * SQL comparison operators
 */
export type SQLOperator =
  | '='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | 'LIKE'
  | 'IN'
  | 'NOT IN'
  | 'BETWEEN'
  | 'IS NULL'
  | 'IS NOT NULL';

/**
 * SQL condition for WHERE clause
 */
export interface SQLCondition {
  field: string;
  operator: SQLOperator;
  value?: unknown;
  values?: unknown[]; // For IN, NOT IN, BETWEEN
}

/**
 * Database configuration
 */
export interface DBConfig {
  // Common
  database?: string;

  // SQLite specific
  filePath?: string;
  memory?: boolean; // In-memory database
  readonly?: boolean;
  timeout?: number; // milliseconds

  // PostgreSQL specific (for future)
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  ssl?: boolean;

  // Connection pool options
  maxConnections?: number;
  minConnections?: number;
  idleTimeout?: number;
}

/**
 * SQLite specific options
 */
export interface SQLiteOptions {
  readonly?: boolean;
  filePath: string;
  timeout?: number; // busy_timeout in ms
  memory?: boolean; // Use in-memory database

  // Performance tuning (KimDB patterns)
  cacheSize?: number; // Default: 10000 (10MB)
  mmapSize?: number; // Default: 268435456 (256MB)
  synchronous?: 'OFF' | 'NORMAL' | 'FULL'; // Default: NORMAL
  journalMode?: 'WAL' | 'TRUNCATE' | 'DELETE'; // Default: WAL
  busyTimeout?: number; // Default: 5000ms
}

/**
 * Query result from INSERT/UPDATE/DELETE
 */
export interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

/**
 * Query response wrapper
 */
export interface QueryResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  rowCount?: number;
}

/**
 * Transaction context
 */
export interface Transaction {
  query<T = unknown>(sql: string, params?: unknown[]): T[];
  get<T = unknown>(sql: string, params?: unknown[]): T | undefined;
  run(sql: string, params?: unknown[]): RunResult;
}

/**
 * Database driver interface
 */
export interface IDatabase {
  query<T = unknown>(sql: string, params?: unknown[]): T[];
  get<T = unknown>(sql: string, params?: unknown[]): T | undefined;
  run(sql: string, params?: unknown[]): RunResult;
  transaction<T>(fn: (tx: Transaction) => T): T;
  close(): void;
}
