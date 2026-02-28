/**
 * @freelang/database-driver - PostgreSQL Driver
 * Based on AION-ts-orchestrator strategy-db.ts pattern
 * Async/await support with pg.Pool
 */
import { IDatabaseAsync, RunResult, TransactionAsync, DBConfig } from './types';
/**
 * PostgreSQL Database Driver
 * Async query execution with connection pooling (implements IDatabaseAsync)
 */
export declare class PostgreSQLDatabase implements IDatabaseAsync {
    private pool;
    private isOpen;
    constructor(config: DBConfig);
    /**
     * Execute SELECT query and return all rows
     * AION pattern: async/await with $1, $2 placeholders
     */
    query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
    /**
     * Execute SELECT query and return first row
     * AION pattern: single row retrieval with LIMIT 1
     */
    get<T = unknown>(sql: string, params?: unknown[]): Promise<T | undefined>;
    /**
     * Execute INSERT/UPDATE/DELETE query
     * AION pattern: returns changes count
     */
    run(sql: string, params?: unknown[]): Promise<RunResult>;
    /**
     * Execute a transaction
     * AION pattern: client.query within BEGIN/COMMIT
     */
    transaction<T>(fn: (tx: TransactionAsync) => Promise<T>): Promise<T>;
    /**
     * Create a table
     * PostgreSQL pattern: IF NOT EXISTS
     */
    createTable(tableName: string, columns: Record<string, string>): Promise<void>;
    /**
     * Drop a table
     */
    dropTable(tableName: string): Promise<void>;
    /**
     * Check if table exists
     * PostgreSQL pattern: information_schema
     */
    tableExists(tableName: string): Promise<boolean>;
    /**
     * Get all tables
     */
    getTables(): Promise<string[]>;
    /**
     * Execute a raw query (for complex operations)
     * AION pattern: used for JOIN, aggregate queries
     */
    rawQuery<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
    /**
     * Get database statistics
     * PostgreSQL pattern: pg_stat_user_tables
     */
    stats(): Promise<{
        tables: number;
        totalRows: number;
        schemaSize: string;
    }>;
    /**
     * Check database health
     */
    health(): Promise<{
        status: string;
        latency: number;
    }>;
    /**
     * Close database connection
     */
    close(): Promise<void>;
    /**
     * Check if database is closed
     */
    isClosed(): boolean;
    /**
     * Get pool statistics
     */
    poolStats(): {
        totalCount: number;
        idleCount: number;
        waitingCount: number;
    };
}
/**
 * Helper function: Convert PostgreSQL camelCase to snake_case
 * Useful for RETURNING clauses with column aliases
 */
export declare function toSnakeCase(str: string): string;
/**
 * Helper function: Convert snake_case to camelCase
 * Useful for result row mapping
 */
export declare function toCamelCase(str: string): string;
//# sourceMappingURL=postgresql.d.ts.map