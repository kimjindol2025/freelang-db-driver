/**
 * @freelang/database-driver - QueryBuilder
 * Fluent SQL query builder (no external dependencies)
 */

import { SQLOperator, SQLCondition } from './types';

/**
 * Fluent SQL QueryBuilder
 * Supports SELECT, WHERE, ORDER BY, LIMIT, OFFSET
 */
export class QueryBuilder {
  private tableName: string;
  private selectedColumns: string[] = ['*'];
  private conditions: SQLCondition[] = [];
  private orderByField?: string;
  private orderByAscending: boolean = true;
  private limitValue?: number;
  private offsetValue?: number;
  private params: unknown[] = [];

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * SELECT clause
   */
  select(columns?: string[]): this {
    if (columns && columns.length > 0) {
      this.selectedColumns = columns;
    }
    return this;
  }

  /**
   * WHERE clause (supports multiple conditions with AND)
   */
  where(field: string, operator: SQLOperator, value?: unknown): this {
    const condition: SQLCondition = {
      field,
      operator,
      value,
    };
    this.conditions.push(condition);
    return this;
  }

  /**
   * WHERE IN clause
   */
  whereIn(field: string, values: unknown[]): this {
    const condition: SQLCondition = {
      field,
      operator: 'IN',
      values,
    };
    this.conditions.push(condition);
    return this;
  }

  /**
   * WHERE BETWEEN clause
   */
  whereBetween(field: string, min: unknown, max: unknown): this {
    const condition: SQLCondition = {
      field,
      operator: 'BETWEEN',
      values: [min, max],
    };
    this.conditions.push(condition);
    return this;
  }

  /**
   * ORDER BY clause
   */
  orderBy(field: string, ascending: boolean = true): this {
    this.orderByField = field;
    this.orderByAscending = ascending;
    return this;
  }

  /**
   * LIMIT clause
   */
  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  /**
   * OFFSET clause
   */
  offset(count: number): this {
    this.offsetValue = count;
    return this;
  }

  /**
   * Build SQL and params
   */
  build(): { sql: string; params: unknown[] } {
    let sql = `SELECT ${this.selectedColumns.join(', ')} FROM ${this.tableName}`;
    const params: unknown[] = [];

    // WHERE clause
    if (this.conditions.length > 0) {
      const whereChunks: string[] = [];

      for (const condition of this.conditions) {
        if (condition.operator === 'IN' && condition.values) {
          const placeholders = condition.values.map(() => '?').join(', ');
          whereChunks.push(`${condition.field} IN (${placeholders})`);
          params.push(...condition.values);
        } else if (condition.operator === 'NOT IN' && condition.values) {
          const placeholders = condition.values.map(() => '?').join(', ');
          whereChunks.push(`${condition.field} NOT IN (${placeholders})`);
          params.push(...condition.values);
        } else if (condition.operator === 'BETWEEN' && condition.values && condition.values.length === 2) {
          whereChunks.push(`${condition.field} BETWEEN ? AND ?`);
          params.push(condition.values[0], condition.values[1]);
        } else if (condition.operator === 'IS NULL') {
          whereChunks.push(`${condition.field} IS NULL`);
        } else if (condition.operator === 'IS NOT NULL') {
          whereChunks.push(`${condition.field} IS NOT NULL`);
        } else {
          whereChunks.push(`${condition.field} ${condition.operator} ?`);
          if (condition.value !== undefined) {
            params.push(condition.value);
          }
        }
      }

      if (whereChunks.length > 0) {
        sql += ` WHERE ${whereChunks.join(' AND ')}`;
      }
    }

    // ORDER BY clause
    if (this.orderByField) {
      sql += ` ORDER BY ${this.orderByField} ${this.orderByAscending ? 'ASC' : 'DESC'}`;
    }

    // LIMIT clause
    if (this.limitValue !== undefined) {
      sql += ` LIMIT ${this.limitValue}`;
    }

    // OFFSET clause
    if (this.offsetValue !== undefined) {
      sql += ` OFFSET ${this.offsetValue}`;
    }

    return { sql, params };
  }

  /**
   * Reset builder state
   */
  reset(): this {
    this.selectedColumns = ['*'];
    this.conditions = [];
    this.orderByField = undefined;
    this.orderByAscending = true;
    this.limitValue = undefined;
    this.offsetValue = undefined;
    this.params = [];
    return this;
  }
}

/**
 * INSERT query builder
 */
export class InsertBuilder {
  private tableName: string;
  private fields: string[] = [];
  private fieldValues: unknown[] = [];

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Set field-value pairs
   */
  values(data: Record<string, unknown>): this {
    this.fields = Object.keys(data);
    this.fieldValues = Object.values(data);
    return this;
  }

  /**
   * Build INSERT query
   */
  build(): { sql: string; params: unknown[] } {
    if (this.fields.length === 0) {
      throw new Error('No fields specified for INSERT');
    }

    const placeholders = this.fields.map(() => '?').join(', ');
    const sql = `INSERT INTO ${this.tableName} (${this.fields.join(', ')}) VALUES (${placeholders})`;

    return { sql, params: this.fieldValues };
  }
}

/**
 * UPDATE query builder
 */
export class UpdateBuilder {
  private tableName: string;
  private updateFields: Map<string, unknown> = new Map();
  private conditions: SQLCondition[] = [];

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * SET clause
   */
  set(field: string, value: unknown): this {
    this.updateFields.set(field, value);
    return this;
  }

  /**
   * WHERE clause
   */
  where(field: string, operator: SQLOperator, value: unknown): this {
    this.conditions.push({ field, operator, value });
    return this;
  }

  /**
   * Build UPDATE query
   */
  build(): { sql: string; params: unknown[] } {
    if (this.updateFields.size === 0) {
      throw new Error('No fields specified for UPDATE');
    }

    const setChunks: string[] = [];
    const params: unknown[] = [];

    for (const [field, fieldValue] of this.updateFields) {
      setChunks.push(`${field} = ?`);
      params.push(fieldValue);
    }

    let sql = `UPDATE ${this.tableName} SET ${setChunks.join(', ')}`;

    if (this.conditions.length > 0) {
      const whereChunks: string[] = [];
      for (const condition of this.conditions) {
        whereChunks.push(`${condition.field} ${condition.operator} ?`);
        params.push(condition.value);
      }
      sql += ` WHERE ${whereChunks.join(' AND ')}`;
    }

    return { sql, params };
  }
}

/**
 * DELETE query builder
 */
export class DeleteBuilder {
  private tableName: string;
  private conditions: SQLCondition[] = [];

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * WHERE clause
   */
  where(field: string, operator: SQLOperator, value: unknown): this {
    this.conditions.push({ field, operator, value });
    return this;
  }

  /**
   * Build DELETE query
   */
  build(): { sql: string; params: unknown[] } {
    let sql = `DELETE FROM ${this.tableName}`;
    const params: unknown[] = [];

    if (this.conditions.length === 0) {
      throw new Error('DELETE without WHERE clause not allowed for safety');
    }

    const whereChunks: string[] = [];
    for (const condition of this.conditions) {
      whereChunks.push(`${condition.field} ${condition.operator} ?`);
      params.push(condition.value);
    }

    sql += ` WHERE ${whereChunks.join(' AND ')}`;
    return { sql, params };
  }
}
