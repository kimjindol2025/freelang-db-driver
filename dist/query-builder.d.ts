/**
 * @freelang/database-driver - QueryBuilder
 * Fluent SQL query builder (no external dependencies)
 */
import { SQLOperator } from './types';
/**
 * Fluent SQL QueryBuilder
 * Supports SELECT, WHERE, ORDER BY, LIMIT, OFFSET
 */
export declare class QueryBuilder {
    private tableName;
    private selectedColumns;
    private conditions;
    private orderByField?;
    private orderByAscending;
    private limitValue?;
    private offsetValue?;
    private params;
    constructor(tableName: string);
    /**
     * SELECT clause
     */
    select(columns?: string[]): this;
    /**
     * WHERE clause (supports multiple conditions with AND)
     */
    where(field: string, operator: SQLOperator, value?: unknown): this;
    /**
     * WHERE IN clause
     */
    whereIn(field: string, values: unknown[]): this;
    /**
     * WHERE BETWEEN clause
     */
    whereBetween(field: string, min: unknown, max: unknown): this;
    /**
     * ORDER BY clause
     */
    orderBy(field: string, ascending?: boolean): this;
    /**
     * LIMIT clause
     */
    limit(count: number): this;
    /**
     * OFFSET clause
     */
    offset(count: number): this;
    /**
     * Build SQL and params
     */
    build(): {
        sql: string;
        params: unknown[];
    };
    /**
     * Reset builder state
     */
    reset(): this;
}
/**
 * INSERT query builder
 */
export declare class InsertBuilder {
    private tableName;
    private fields;
    private fieldValues;
    constructor(tableName: string);
    /**
     * Set field-value pairs
     */
    values(data: Record<string, unknown>): this;
    /**
     * Build INSERT query
     */
    build(): {
        sql: string;
        params: unknown[];
    };
}
/**
 * UPDATE query builder
 */
export declare class UpdateBuilder {
    private tableName;
    private updateFields;
    private conditions;
    constructor(tableName: string);
    /**
     * SET clause
     */
    set(field: string, value: unknown): this;
    /**
     * WHERE clause
     */
    where(field: string, operator: SQLOperator, value: unknown): this;
    /**
     * Build UPDATE query
     */
    build(): {
        sql: string;
        params: unknown[];
    };
}
/**
 * DELETE query builder
 */
export declare class DeleteBuilder {
    private tableName;
    private conditions;
    constructor(tableName: string);
    /**
     * WHERE clause
     */
    where(field: string, operator: SQLOperator, value: unknown): this;
    /**
     * Build DELETE query
     */
    build(): {
        sql: string;
        params: unknown[];
    };
}
//# sourceMappingURL=query-builder.d.ts.map