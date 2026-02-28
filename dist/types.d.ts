/**
 * @freelang/database-driver - Common Types
 * SQL operators and response interfaces
 */
/**
 * SQL comparison operators
 */
export type SQLOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'NOT IN' | 'BETWEEN' | 'IS NULL' | 'IS NOT NULL';
/**
 * SQL condition for WHERE clause
 */
export interface SQLCondition {
    field: string;
    operator: SQLOperator;
    value?: unknown;
    values?: unknown[];
}
/**
 * Database configuration
 */
export interface DBConfig {
    database?: string;
    filePath?: string;
    memory?: boolean;
    readonly?: boolean;
    timeout?: number;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    ssl?: boolean;
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
    timeout?: number;
    memory?: boolean;
    cacheSize?: number;
    mmapSize?: number;
    synchronous?: 'OFF' | 'NORMAL' | 'FULL';
    journalMode?: 'WAL' | 'TRUNCATE' | 'DELETE';
    busyTimeout?: number;
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
 * Synchronous Database driver interface (SQLite)
 */
export interface IDatabase {
    query<T = unknown>(sql: string, params?: unknown[]): T[];
    get<T = unknown>(sql: string, params?: unknown[]): T | undefined;
    run(sql: string, params?: unknown[]): RunResult;
    transaction<T>(fn: (tx: Transaction) => T): T;
    close(): void;
}
/**
 * Asynchronous Database driver interface (PostgreSQL)
 */
export interface IDatabaseAsync {
    query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
    get<T = unknown>(sql: string, params?: unknown[]): Promise<T | undefined>;
    run(sql: string, params?: unknown[]): Promise<RunResult>;
    transaction<T>(fn: (tx: TransactionAsync) => Promise<T>): Promise<T>;
    close(): Promise<void>;
}
/**
 * Async Transaction context
 */
export interface TransactionAsync {
    query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
    get<T = unknown>(sql: string, params?: unknown[]): Promise<T | undefined>;
    run(sql: string, params?: unknown[]): Promise<RunResult>;
}
//# sourceMappingURL=types.d.ts.map