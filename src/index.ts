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
  IDatabase,
} from './types';

// Classes
export { SQLiteDatabase } from './sqlite';
export { SQLitePool } from './pool';
export {
  QueryBuilder,
  InsertBuilder,
  UpdateBuilder,
  DeleteBuilder,
} from './query-builder';

// Version
export const VERSION = '1.0.0';

/**
 * Factory function for creating SQLiteDatabase
 */
export function createSQLiteDatabase(
  filePath: string,
  options?: any
) {
  return new (require('./sqlite').SQLiteDatabase)(filePath, options);
}

/**
 * Factory function for creating QueryBuilder
 */
export function createQueryBuilder(tableName: string) {
  return new (require('./query-builder').QueryBuilder)(tableName);
}
