/**
 * @freelang/database-driver
 * SQLite & PostgreSQL drivers - npm sqlite3/pg replacement for FreeLang
 *
 * Main export module
 */

// Types
export type {
  SQLOperator,
  SQLCondition,
  DBConfig,
  SQLiteOptions,
  RunResult,
  QueryResponse,
  Transaction,
  TransactionAsync,
  IDatabase,
  IDatabaseAsync,
} from './types';

// Classes - SQLite
export { SQLiteDatabase } from './sqlite';
export { SQLitePool } from './pool';

// Classes - PostgreSQL
export { PostgreSQLDatabase, toSnakeCase, toCamelCase } from './postgresql';

// Classes - Query Builders
export {
  QueryBuilder,
  InsertBuilder,
  UpdateBuilder,
  DeleteBuilder,
} from './query-builder';

// Version
export const VERSION = '1.0.0';

/**
 * Factory function for creating database instance
 * Supports both SQLite and PostgreSQL
 */
export function createDatabase(
  type: 'sqlite' | 'postgresql',
  config: any
): any {
  if (type === 'sqlite') {
    const { SQLiteDatabase } = require('./sqlite');
    return new SQLiteDatabase(config.filePath || config.database, config);
  } else if (type === 'postgresql') {
    const { PostgreSQLDatabase } = require('./postgresql');
    return new PostgreSQLDatabase(config);
  } else {
    throw new Error(`Unsupported database type: ${type}`);
  }
}

/**
 * Factory function for creating SQLiteDatabase
 */
export function createSQLiteDatabase(
  filePath: string,
  options?: any
) {
  const { SQLiteDatabase } = require('./sqlite');
  return new SQLiteDatabase(filePath, options);
}

/**
 * Factory function for creating PostgreSQLDatabase
 */
export function createPostgresDatabase(config: any) {
  const { PostgreSQLDatabase } = require('./postgresql');
  return new PostgreSQLDatabase(config);
}

/**
 * Factory function for creating QueryBuilder
 */
export function createQueryBuilder(tableName: string) {
  const { QueryBuilder } = require('./query-builder');
  return new QueryBuilder(tableName);
}
