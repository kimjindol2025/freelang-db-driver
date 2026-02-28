/**
 * @freelang/database-driver - SQLite Connection Pool
 * Lightweight connection pooling (KimDB pattern)
 */
import Database from 'better-sqlite3';
import { SQLiteOptions } from './types';
/**
 * SQLite Connection Pool
 * Manages multiple SQLite connections with acquire/release pattern
 */
export declare class SQLitePool {
    private dbPath;
    private maxConnections;
    private availableConnections;
    private activeConnections;
    private options;
    constructor(dbPath: string, maxConnections?: number, options?: Partial<SQLiteOptions>);
    /**
     * Create and configure a new SQLite connection
     */
    private createConnection;
    /**
     * Acquire a connection from the pool
     */
    acquire(): Promise<Database.Database>;
    /**
     * Release a connection back to the pool
     */
    release(db: Database.Database): void;
    /**
     * Run a transaction using a pooled connection
     */
    transaction<T>(fn: (db: Database.Database) => T): Promise<T>;
    /**
     * Close all connections in the pool
     */
    close(): void;
    /**
     * Get pool statistics
     */
    stats(): {
        available: number;
        active: number;
        total: number;
        max: number;
    };
}
//# sourceMappingURL=pool.d.ts.map