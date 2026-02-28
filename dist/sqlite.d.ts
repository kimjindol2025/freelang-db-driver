/**
 * @freelang/database-driver - SQLiteDatabase
 * Main SQLite driver class using better-sqlite3
 */
import { IDatabase, RunResult, Transaction, SQLiteOptions } from './types';
/**
 * SQLiteDatabase - Main driver class
 * Supports synchronous operations, transactions, and connection pooling
 */
export declare class SQLiteDatabase implements IDatabase {
    private db;
    private pool?;
    private usePool;
    private isOpen;
    constructor(filePath: string, options?: Partial<SQLiteOptions>);
    /**
     * Execute SELECT query and return all rows
     */
    query<T = unknown>(sql: string, params?: unknown[]): T[];
    /**
     * Execute SELECT query and return first row
     */
    get<T = unknown>(sql: string, params?: unknown[]): T | undefined;
    /**
     * Execute INSERT/UPDATE/DELETE query
     */
    run(sql: string, params?: unknown[]): RunResult;
    /**
     * Execute a transaction
     */
    transaction<T>(fn: (tx: Transaction) => T): T;
    /**
     * Create a table if it doesn't exist
     */
    createTable(tableName: string, columns: Record<string, string>): void;
    /**
     * Drop a table
     */
    dropTable(tableName: string): void;
    /**
     * Check if table exists
     */
    tableExists(tableName: string): boolean;
    /**
     * Get all tables
     */
    getTables(): string[];
    /**
     * Vacuum the database
     */
    vacuum(): void;
    /**
     * Get database statistics
     */
    stats(): {
        tables: number;
        pages: number;
        cacheSize: number;
        journalMode: string;
    };
    /**
     * Close the database connection
     */
    close(): void;
    /**
     * Check if database is open
     */
    isClosed(): boolean;
}
//# sourceMappingURL=sqlite.d.ts.map