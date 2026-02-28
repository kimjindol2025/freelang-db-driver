"use strict";
/**
 * @freelang/database-driver - QueryBuilder
 * Fluent SQL query builder (no external dependencies)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteBuilder = exports.UpdateBuilder = exports.InsertBuilder = exports.QueryBuilder = void 0;
/**
 * Fluent SQL QueryBuilder
 * Supports SELECT, WHERE, ORDER BY, LIMIT, OFFSET
 */
class QueryBuilder {
    constructor(tableName) {
        this.selectedColumns = ['*'];
        this.conditions = [];
        this.orderByAscending = true;
        this.params = [];
        this.tableName = tableName;
    }
    /**
     * SELECT clause
     */
    select(columns) {
        if (columns && columns.length > 0) {
            this.selectedColumns = columns;
        }
        return this;
    }
    /**
     * WHERE clause (supports multiple conditions with AND)
     */
    where(field, operator, value) {
        const condition = {
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
    whereIn(field, values) {
        const condition = {
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
    whereBetween(field, min, max) {
        const condition = {
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
    orderBy(field, ascending = true) {
        this.orderByField = field;
        this.orderByAscending = ascending;
        return this;
    }
    /**
     * LIMIT clause
     */
    limit(count) {
        this.limitValue = count;
        return this;
    }
    /**
     * OFFSET clause
     */
    offset(count) {
        this.offsetValue = count;
        return this;
    }
    /**
     * Build SQL and params
     */
    build() {
        let sql = `SELECT ${this.selectedColumns.join(', ')} FROM ${this.tableName}`;
        const params = [];
        // WHERE clause
        if (this.conditions.length > 0) {
            const whereChunks = [];
            for (const condition of this.conditions) {
                if (condition.operator === 'IN' && condition.values) {
                    const placeholders = condition.values.map(() => '?').join(', ');
                    whereChunks.push(`${condition.field} IN (${placeholders})`);
                    params.push(...condition.values);
                }
                else if (condition.operator === 'NOT IN' && condition.values) {
                    const placeholders = condition.values.map(() => '?').join(', ');
                    whereChunks.push(`${condition.field} NOT IN (${placeholders})`);
                    params.push(...condition.values);
                }
                else if (condition.operator === 'BETWEEN' && condition.values && condition.values.length === 2) {
                    whereChunks.push(`${condition.field} BETWEEN ? AND ?`);
                    params.push(condition.values[0], condition.values[1]);
                }
                else if (condition.operator === 'IS NULL') {
                    whereChunks.push(`${condition.field} IS NULL`);
                }
                else if (condition.operator === 'IS NOT NULL') {
                    whereChunks.push(`${condition.field} IS NOT NULL`);
                }
                else {
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
    reset() {
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
exports.QueryBuilder = QueryBuilder;
/**
 * INSERT query builder
 */
class InsertBuilder {
    constructor(tableName) {
        this.fields = [];
        this.fieldValues = [];
        this.tableName = tableName;
    }
    /**
     * Set field-value pairs
     */
    values(data) {
        this.fields = Object.keys(data);
        this.fieldValues = Object.values(data);
        return this;
    }
    /**
     * Build INSERT query
     */
    build() {
        if (this.fields.length === 0) {
            throw new Error('No fields specified for INSERT');
        }
        const placeholders = this.fields.map(() => '?').join(', ');
        const sql = `INSERT INTO ${this.tableName} (${this.fields.join(', ')}) VALUES (${placeholders})`;
        return { sql, params: this.fieldValues };
    }
}
exports.InsertBuilder = InsertBuilder;
/**
 * UPDATE query builder
 */
class UpdateBuilder {
    constructor(tableName) {
        this.updateFields = new Map();
        this.conditions = [];
        this.tableName = tableName;
    }
    /**
     * SET clause - accepts object or individual field-value pairs
     */
    set(fieldOrObject, value) {
        if (typeof fieldOrObject === 'object' && fieldOrObject !== null && value === undefined) {
            // Object form: set({ name: 'Bob', age: 30 })
            for (const [key, val] of Object.entries(fieldOrObject)) {
                this.updateFields.set(key, val);
            }
        }
        else if (typeof fieldOrObject === 'string') {
            // Field-value form: set('name', 'Bob')
            this.updateFields.set(fieldOrObject, value);
        }
        else {
            throw new Error('Invalid arguments to set()');
        }
        return this;
    }
    /**
     * WHERE clause
     */
    where(field, operator, value) {
        this.conditions.push({ field, operator, value });
        return this;
    }
    /**
     * WHERE IN clause
     */
    whereIn(field, values) {
        const condition = {
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
    whereBetween(field, min, max) {
        const condition = {
            field,
            operator: 'BETWEEN',
            values: [min, max],
        };
        this.conditions.push(condition);
        return this;
    }
    /**
     * Build UPDATE query
     */
    build() {
        if (this.updateFields.size === 0) {
            throw new Error('No fields specified for UPDATE');
        }
        const setChunks = [];
        const params = [];
        for (const [field, fieldValue] of this.updateFields) {
            setChunks.push(`${field} = ?`);
            params.push(fieldValue);
        }
        let sql = `UPDATE ${this.tableName} SET ${setChunks.join(', ')}`;
        if (this.conditions.length > 0) {
            const whereChunks = [];
            for (const condition of this.conditions) {
                if (condition.operator === 'IN' && condition.values) {
                    const placeholders = condition.values.map(() => '?').join(', ');
                    whereChunks.push(`${condition.field} IN (${placeholders})`);
                    params.push(...condition.values);
                }
                else if (condition.operator === 'NOT IN' && condition.values) {
                    const placeholders = condition.values.map(() => '?').join(', ');
                    whereChunks.push(`${condition.field} NOT IN (${placeholders})`);
                    params.push(...condition.values);
                }
                else if (condition.operator === 'BETWEEN' && condition.values && condition.values.length === 2) {
                    whereChunks.push(`${condition.field} BETWEEN ? AND ?`);
                    params.push(condition.values[0], condition.values[1]);
                }
                else {
                    whereChunks.push(`${condition.field} ${condition.operator} ?`);
                    params.push(condition.value);
                }
            }
            sql += ` WHERE ${whereChunks.join(' AND ')}`;
        }
        return { sql, params };
    }
}
exports.UpdateBuilder = UpdateBuilder;
/**
 * DELETE query builder
 */
class DeleteBuilder {
    constructor(tableName) {
        this.conditions = [];
        this.tableName = tableName;
    }
    /**
     * WHERE clause
     */
    where(field, operator, value) {
        this.conditions.push({ field, operator, value });
        return this;
    }
    /**
     * WHERE IN clause
     */
    whereIn(field, values) {
        const condition = {
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
    whereBetween(field, min, max) {
        const condition = {
            field,
            operator: 'BETWEEN',
            values: [min, max],
        };
        this.conditions.push(condition);
        return this;
    }
    /**
     * Build DELETE query
     */
    build() {
        let sql = `DELETE FROM ${this.tableName}`;
        const params = [];
        if (this.conditions.length === 0) {
            throw new Error('DELETE without WHERE clause not allowed for safety');
        }
        const whereChunks = [];
        for (const condition of this.conditions) {
            if (condition.operator === 'IN' && condition.values) {
                const placeholders = condition.values.map(() => '?').join(', ');
                whereChunks.push(`${condition.field} IN (${placeholders})`);
                params.push(...condition.values);
            }
            else if (condition.operator === 'NOT IN' && condition.values) {
                const placeholders = condition.values.map(() => '?').join(', ');
                whereChunks.push(`${condition.field} NOT IN (${placeholders})`);
                params.push(...condition.values);
            }
            else if (condition.operator === 'BETWEEN' && condition.values && condition.values.length === 2) {
                whereChunks.push(`${condition.field} BETWEEN ? AND ?`);
                params.push(condition.values[0], condition.values[1]);
            }
            else {
                whereChunks.push(`${condition.field} ${condition.operator} ?`);
                params.push(condition.value);
            }
        }
        sql += ` WHERE ${whereChunks.join(' AND ')}`;
        return { sql, params };
    }
}
exports.DeleteBuilder = DeleteBuilder;
//# sourceMappingURL=query-builder.js.map