"use strict";
/**
 * @freelang/database-driver - SQLite Connection Pool
 * Lightweight connection pooling (KimDB pattern)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLitePool = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
/**
 * SQLite Connection Pool
 * Manages multiple SQLite connections with acquire/release pattern
 */
class SQLitePool {
    constructor(dbPath, maxConnections = 5, options) {
        this.availableConnections = [];
        this.activeConnections = new Set();
        this.dbPath = dbPath;
        this.maxConnections = maxConnections;
        this.options = {
            filePath: dbPath,
            cacheSize: 10000,
            mmapSize: 268435456,
            synchronous: 'NORMAL',
            journalMode: 'WAL',
            busyTimeout: 5000,
            ...options,
        };
        // Pre-create connections
        for (let i = 0; i < maxConnections; i++) {
            const db = this.createConnection();
            this.availableConnections.push(db);
        }
    }
    /**
     * Create and configure a new SQLite connection
     */
    createConnection() {
        const db = new better_sqlite3_1.default(this.dbPath, {
            readonly: this.options.readonly || false,
            timeout: this.options.busyTimeout || 5000,
            fileMustExist: false,
        });
        // Configure for performance (KimDB patterns)
        db.pragma(`cache_size = ${this.options.cacheSize || 10000}`);
        db.pragma(`mmap_size = ${this.options.mmapSize || 268435456}`);
        db.pragma(`synchronous = ${this.options.synchronous || 'NORMAL'}`);
        db.pragma(`journal_mode = ${this.options.journalMode || 'WAL'}`);
        db.pragma('busy_timeout = 5000');
        return db;
    }
    /**
     * Acquire a connection from the pool
     */
    async acquire() {
        // Try to get available connection
        if (this.availableConnections.length > 0) {
            const db = this.availableConnections.pop();
            this.activeConnections.add(db);
            return db;
        }
        // Create new connection if under limit
        if (this.activeConnections.size < this.maxConnections) {
            const db = this.createConnection();
            this.activeConnections.add(db);
            return db;
        }
        // Wait for available connection (simple busy-wait, not ideal but works)
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (this.availableConnections.length > 0) {
                    clearInterval(checkInterval);
                    const db = this.availableConnections.pop();
                    this.activeConnections.add(db);
                    resolve(db);
                }
            }, 10);
        });
    }
    /**
     * Release a connection back to the pool
     */
    release(db) {
        this.activeConnections.delete(db);
        this.availableConnections.push(db);
    }
    /**
     * Run a transaction using a pooled connection
     */
    async transaction(fn) {
        const db = await this.acquire();
        try {
            const transaction = db.transaction(fn);
            return transaction(db);
        }
        finally {
            this.release(db);
        }
    }
    /**
     * Close all connections in the pool
     */
    close() {
        for (const db of this.availableConnections) {
            db.close();
        }
        for (const db of this.activeConnections) {
            db.close();
        }
        this.availableConnections = [];
        this.activeConnections.clear();
    }
    /**
     * Get pool statistics
     */
    stats() {
        return {
            available: this.availableConnections.length,
            active: this.activeConnections.size,
            total: this.availableConnections.length + this.activeConnections.size,
            max: this.maxConnections,
        };
    }
}
exports.SQLitePool = SQLitePool;
//# sourceMappingURL=pool.js.map