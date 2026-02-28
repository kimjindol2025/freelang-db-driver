"use strict";
/**
 * @freelang/database-driver - SQLiteDatabase
 * Main SQLite driver class using better-sqlite3
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLiteDatabase = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const pool_1 = require("./pool");
/**
 * SQLiteDatabase - Main driver class
 * Supports synchronous operations, transactions, and connection pooling
 */
class SQLiteDatabase {
    constructor(filePath, options) {
        this.isOpen = true;
        const opts = {
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
            this.pool = new pool_1.SQLitePool(opts.filePath, 5, opts);
            // Get one connection synchronously
            this.db = new better_sqlite3_1.default(opts.filePath, {
                readonly: opts.readonly || false,
                timeout: opts.busyTimeout || 5000,
            });
        }
        else {
            // Single connection (in-memory or special case)
            this.db = new better_sqlite3_1.default(opts.filePath || ':memory:', {
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
    query(sql, params) {
        if (!this.isOpen)
            throw new Error('Database is closed');
        try {
            const stmt = this.db.prepare(sql);
            if (params && params.length > 0) {
                return stmt.all(...params);
            }
            return stmt.all();
        }
        catch (error) {
            throw new Error(`Query failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Execute SELECT query and return first row
     */
    get(sql, params) {
        if (!this.isOpen)
            throw new Error('Database is closed');
        try {
            const stmt = this.db.prepare(sql);
            if (params && params.length > 0) {
                return stmt.get(...params);
            }
            return stmt.get();
        }
        catch (error) {
            throw new Error(`Get failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Execute INSERT/UPDATE/DELETE query
     */
    run(sql, params) {
        if (!this.isOpen)
            throw new Error('Database is closed');
        try {
            const stmt = this.db.prepare(sql);
            let result;
            if (params && params.length > 0) {
                result = stmt.run(...params);
            }
            else {
                result = stmt.run();
            }
            return {
                changes: result.changes,
                lastInsertRowid: result.lastInsertRowid,
            };
        }
        catch (error) {
            throw new Error(`Run failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Execute a transaction
     */
    transaction(fn) {
        if (!this.isOpen)
            throw new Error('Database is closed');
        const transactionFn = this.db.transaction((tx) => {
            return fn(tx);
        });
        return transactionFn({
            query: (sql, params) => this.query(sql, params),
            get: (sql, params) => this.get(sql, params),
            run: (sql, params) => this.run(sql, params),
        });
    }
    /**
     * Create a table if it doesn't exist
     */
    createTable(tableName, columns) {
        if (!this.isOpen)
            throw new Error('Database is closed');
        const columnDefs = Object.entries(columns)
            .map(([name, type]) => `${name} ${type}`)
            .join(', ');
        const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefs})`;
        this.run(sql);
    }
    /**
     * Drop a table
     */
    dropTable(tableName) {
        if (!this.isOpen)
            throw new Error('Database is closed');
        this.run(`DROP TABLE IF EXISTS ${tableName}`);
    }
    /**
     * Check if table exists
     */
    tableExists(tableName) {
        if (!this.isOpen)
            throw new Error('Database is closed');
        const result = this.get(`SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?`, [tableName]);
        return (result?.count ?? 0) > 0;
    }
    /**
     * Get all tables
     */
    getTables() {
        if (!this.isOpen)
            throw new Error('Database is closed');
        const result = this.query(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`);
        return result.map(row => row.name);
    }
    /**
     * Vacuum the database
     */
    vacuum() {
        if (!this.isOpen)
            throw new Error('Database is closed');
        this.run('VACUUM');
    }
    /**
     * Get database statistics
     */
    stats() {
        if (!this.isOpen)
            throw new Error('Database is closed');
        const tables = this.getTables().length;
        const pageCount = this.db.pragma('page_count')[0] || 0;
        const cacheSize = this.db.pragma('cache_size')[0] || 0;
        const journalMode = (this.db.pragma('journal_mode')[0] || 'OFF').toUpperCase();
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
    close() {
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
    isClosed() {
        return !this.isOpen;
    }
}
exports.SQLiteDatabase = SQLiteDatabase;
//# sourceMappingURL=sqlite.js.map