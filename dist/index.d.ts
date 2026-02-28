/**
 * @freelang/database-driver
 * SQLite & PostgreSQL drivers - npm sqlite3/pg replacement for FreeLang
 *
 * Main export module
 */
export type { SQLOperator, SQLCondition, DBConfig, SQLiteOptions, RunResult, QueryResponse, Transaction, TransactionAsync, IDatabase, IDatabaseAsync, } from './types';
export { SQLiteDatabase } from './sqlite';
export { SQLitePool } from './pool';
export { PostgreSQLDatabase, toSnakeCase, toCamelCase } from './postgresql';
export { QueryBuilder, InsertBuilder, UpdateBuilder, DeleteBuilder, } from './query-builder';
export declare const VERSION = "1.0.0";
/**
 * Factory function for creating database instance
 * Supports both SQLite and PostgreSQL
 */
export declare function createDatabase(type: 'sqlite' | 'postgresql', config: any): any;
/**
 * Factory function for creating SQLiteDatabase
 */
export declare function createSQLiteDatabase(filePath: string, options?: any): any;
/**
 * Factory function for creating PostgreSQLDatabase
 */
export declare function createPostgresDatabase(config: any): any;
/**
 * Factory function for creating QueryBuilder
 */
export declare function createQueryBuilder(tableName: string): any;
//# sourceMappingURL=index.d.ts.map