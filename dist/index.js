"use strict";
/**
 * @freelang/database-driver
 * SQLite & PostgreSQL drivers - npm sqlite3/pg replacement for FreeLang
 *
 * Main export module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.DeleteBuilder = exports.UpdateBuilder = exports.InsertBuilder = exports.QueryBuilder = exports.toCamelCase = exports.toSnakeCase = exports.PostgreSQLDatabase = exports.SQLitePool = exports.SQLiteDatabase = void 0;
exports.createDatabase = createDatabase;
exports.createSQLiteDatabase = createSQLiteDatabase;
exports.createPostgresDatabase = createPostgresDatabase;
exports.createQueryBuilder = createQueryBuilder;
// Classes - SQLite
var sqlite_1 = require("./sqlite");
Object.defineProperty(exports, "SQLiteDatabase", { enumerable: true, get: function () { return sqlite_1.SQLiteDatabase; } });
var pool_1 = require("./pool");
Object.defineProperty(exports, "SQLitePool", { enumerable: true, get: function () { return pool_1.SQLitePool; } });
// Classes - PostgreSQL
var postgresql_1 = require("./postgresql");
Object.defineProperty(exports, "PostgreSQLDatabase", { enumerable: true, get: function () { return postgresql_1.PostgreSQLDatabase; } });
Object.defineProperty(exports, "toSnakeCase", { enumerable: true, get: function () { return postgresql_1.toSnakeCase; } });
Object.defineProperty(exports, "toCamelCase", { enumerable: true, get: function () { return postgresql_1.toCamelCase; } });
// Classes - Query Builders
var query_builder_1 = require("./query-builder");
Object.defineProperty(exports, "QueryBuilder", { enumerable: true, get: function () { return query_builder_1.QueryBuilder; } });
Object.defineProperty(exports, "InsertBuilder", { enumerable: true, get: function () { return query_builder_1.InsertBuilder; } });
Object.defineProperty(exports, "UpdateBuilder", { enumerable: true, get: function () { return query_builder_1.UpdateBuilder; } });
Object.defineProperty(exports, "DeleteBuilder", { enumerable: true, get: function () { return query_builder_1.DeleteBuilder; } });
// Version
exports.VERSION = '1.0.0';
/**
 * Factory function for creating database instance
 * Supports both SQLite and PostgreSQL
 */
function createDatabase(type, config) {
    if (type === 'sqlite') {
        const { SQLiteDatabase } = require('./sqlite');
        return new SQLiteDatabase(config.filePath || config.database, config);
    }
    else if (type === 'postgresql') {
        const { PostgreSQLDatabase } = require('./postgresql');
        return new PostgreSQLDatabase(config);
    }
    else {
        throw new Error(`Unsupported database type: ${type}`);
    }
}
/**
 * Factory function for creating SQLiteDatabase
 */
function createSQLiteDatabase(filePath, options) {
    const { SQLiteDatabase } = require('./sqlite');
    return new SQLiteDatabase(filePath, options);
}
/**
 * Factory function for creating PostgreSQLDatabase
 */
function createPostgresDatabase(config) {
    const { PostgreSQLDatabase } = require('./postgresql');
    return new PostgreSQLDatabase(config);
}
/**
 * Factory function for creating QueryBuilder
 */
function createQueryBuilder(tableName) {
    const { QueryBuilder } = require('./query-builder');
    return new QueryBuilder(tableName);
}
//# sourceMappingURL=index.js.map