"use strict";
/**
 * @freelang/database-driver
 * SQLite & PostgreSQL drivers - npm sqlite3/pg replacement for FreeLang
 *
 * Main export module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.DeleteBuilder = exports.UpdateBuilder = exports.InsertBuilder = exports.QueryBuilder = exports.SQLitePool = exports.SQLiteDatabase = void 0;
exports.createSQLiteDatabase = createSQLiteDatabase;
exports.createQueryBuilder = createQueryBuilder;
// Classes
var sqlite_1 = require("./sqlite");
Object.defineProperty(exports, "SQLiteDatabase", { enumerable: true, get: function () { return sqlite_1.SQLiteDatabase; } });
var pool_1 = require("./pool");
Object.defineProperty(exports, "SQLitePool", { enumerable: true, get: function () { return pool_1.SQLitePool; } });
var query_builder_1 = require("./query-builder");
Object.defineProperty(exports, "QueryBuilder", { enumerable: true, get: function () { return query_builder_1.QueryBuilder; } });
Object.defineProperty(exports, "InsertBuilder", { enumerable: true, get: function () { return query_builder_1.InsertBuilder; } });
Object.defineProperty(exports, "UpdateBuilder", { enumerable: true, get: function () { return query_builder_1.UpdateBuilder; } });
Object.defineProperty(exports, "DeleteBuilder", { enumerable: true, get: function () { return query_builder_1.DeleteBuilder; } });
// Version
exports.VERSION = '1.0.0';
/**
 * Factory function for creating SQLiteDatabase
 */
function createSQLiteDatabase(filePath, options) {
    return new (require('./sqlite').SQLiteDatabase)(filePath, options);
}
/**
 * Factory function for creating QueryBuilder
 */
function createQueryBuilder(tableName) {
    return new (require('./query-builder').QueryBuilder)(tableName);
}
//# sourceMappingURL=index.js.map