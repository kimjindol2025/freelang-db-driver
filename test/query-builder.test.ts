/**
 * @freelang/database-driver - QueryBuilder Tests
 * Test suite for fluent query builder API
 */

import {
  QueryBuilder,
  InsertBuilder,
  UpdateBuilder,
  DeleteBuilder
} from '../src/query-builder';

describe('QueryBuilder', () => {
  describe('SELECT with QueryBuilder', () => {
    test('should build simple SELECT', () => {
      const qb = new QueryBuilder('users');
      const { sql, params } = qb.select().build();

      expect(sql).toBe('SELECT * FROM users');
      expect(params).toEqual([]);
    });

    test('should select specific columns', () => {
      const qb = new QueryBuilder('users');
      const { sql, params } = qb.select(['id', 'name', 'email']).build();

      expect(sql).toBe('SELECT id, name, email FROM users');
      expect(params).toEqual([]);
    });

    test('should add WHERE clause', () => {
      const qb = new QueryBuilder('users');
      const { sql, params } = qb
        .select()
        .where('id', '=', 1)
        .build();

      expect(sql).toBe('SELECT * FROM users WHERE id = ?');
      expect(params).toEqual([1]);
    });

    test('should add multiple WHERE clauses', () => {
      const qb = new QueryBuilder('users');
      const { sql, params } = qb
        .select()
        .where('age', '>', 18)
        .where('status', '=', 'active')
        .build();

      expect(sql).toBe('SELECT * FROM users WHERE age > ? AND status = ?');
      expect(params).toEqual([18, 'active']);
    });

    test('should support WHERE IN operator', () => {
      const qb = new QueryBuilder('users');
      const { sql, params } = qb
        .select()
        .whereIn('id', [1, 2, 3])
        .build();

      expect(sql).toBe('SELECT * FROM users WHERE id IN (?, ?, ?)');
      expect(params).toEqual([1, 2, 3]);
    });

    test('should support WHERE BETWEEN operator', () => {
      const qb = new QueryBuilder('products');
      const { sql, params } = qb
        .select()
        .whereBetween('price', 10, 100)
        .build();

      expect(sql).toBe('SELECT * FROM products WHERE price BETWEEN ? AND ?');
      expect(params).toEqual([10, 100]);
    });

    test('should add ORDER BY clause', () => {
      const qb = new QueryBuilder('users');
      const { sql, params } = qb
        .select()
        .orderBy('name')
        .build();

      expect(sql).toBe('SELECT * FROM users ORDER BY name ASC');
      expect(params).toEqual([]);
    });

    test('should add ORDER BY with descending', () => {
      const qb = new QueryBuilder('users');
      const { sql, params } = qb
        .select()
        .orderBy('created_at', false)
        .build();

      expect(sql).toBe('SELECT * FROM users ORDER BY created_at DESC');
      expect(params).toEqual([]);
    });

    test('should add multiple ORDER BY clauses', () => {
      const qb = new QueryBuilder('users');
      const { sql, params } = qb
        .select()
        .orderBy('status')
        .orderBy('created_at', false)
        .build();

      expect(sql).toContain('ORDER BY status ASC, created_at DESC');
      expect(params).toEqual([]);
    });

    test('should add LIMIT clause', () => {
      const qb = new QueryBuilder('users');
      const { sql, params } = qb
        .select()
        .limit(10)
        .build();

      expect(sql).toBe('SELECT * FROM users LIMIT 10');
      expect(params).toEqual([]);
    });

    test('should add OFFSET clause', () => {
      const qb = new QueryBuilder('users');
      const { sql, params } = qb
        .select()
        .limit(10)
        .offset(20)
        .build();

      expect(sql).toBe('SELECT * FROM users LIMIT 10 OFFSET 20');
      expect(params).toEqual([]);
    });

    test('should chain all clauses together', () => {
      const qb = new QueryBuilder('users');
      const { sql, params } = qb
        .select(['id', 'name', 'email'])
        .where('age', '>', 18)
        .where('status', '=', 'active')
        .orderBy('created_at', false)
        .limit(20)
        .offset(0)
        .build();

      expect(sql).toContain('SELECT id, name, email FROM users');
      expect(sql).toContain('WHERE age > ? AND status = ?');
      expect(sql).toContain('ORDER BY created_at DESC');
      expect(sql).toContain('LIMIT 20 OFFSET 0');
      expect(params).toEqual([18, 'active']);
    });

    test('should support various comparison operators', () => {
      const operators = ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'NOT IN'];

      operators.forEach((op) => {
        const qb = new QueryBuilder('users');
        const value = op === 'LIKE' ? '%test%' : op === 'NOT IN' ? [1, 2] : 'test';
        const { sql } = qb.select().where('field', op as any, value).build();
        expect(sql).toContain(op);
      });
    });
  });

  describe('INSERT with InsertBuilder', () => {
    test('should build simple INSERT', () => {
      const ib = new InsertBuilder('users');
      const { sql, params } = ib
        .values({ name: 'Alice', email: 'alice@example.com' })
        .build();

      expect(sql).toContain('INSERT INTO users');
      expect(sql).toContain('(name, email)');
      expect(sql).toContain('VALUES (?, ?)');
      expect(params).toEqual(['Alice', 'alice@example.com']);
    });

    test('should handle multiple field inserts', () => {
      const ib = new InsertBuilder('products');
      const { sql, params } = ib
        .values({
          name: 'Widget',
          price: 19.99,
          stock: 100,
          category: 'tools'
        })
        .build();

      expect(sql).toContain('INSERT INTO products');
      expect(params.length).toBe(4);
      expect(params).toContain('Widget');
      expect(params).toContain(19.99);
    });

    test('should handle NULL values', () => {
      const ib = new InsertBuilder('users');
      const { sql, params } = ib
        .values({ name: 'Alice', email: null, phone: undefined })
        .build();

      expect(sql).toContain('INSERT INTO users');
      expect(params).toContain('Alice');
    });

    test('should handle various data types', () => {
      const ib = new InsertBuilder('records');
      const { sql, params } = ib
        .values({
          id: 1,
          name: 'Test',
          price: 19.99,
          active: true,
          created_at: '2026-02-28T00:00:00Z'
        })
        .build();

      expect(params).toEqual([1, 'Test', 19.99, true, '2026-02-28T00:00:00Z']);
    });
  });

  describe('UPDATE with UpdateBuilder', () => {
    test('should build simple UPDATE', () => {
      const ub = new UpdateBuilder('users');
      const { sql, params } = ub
        .set({ name: 'Bob', email: 'bob@example.com' })
        .where('id', '=', 1)
        .build();

      expect(sql).toContain('UPDATE users');
      expect(sql).toContain('SET');
      expect(sql).toContain('WHERE id = ?');
      expect(params).toContain('Bob');
      expect(params).toContain(1);
    });

    test('should handle multiple updates', () => {
      const ub = new UpdateBuilder('users');
      const { sql, params } = ub
        .set({ name: 'Charlie', age: 35, status: 'inactive' })
        .where('id', '=', 2)
        .build();

      expect(sql).toContain('SET');
      expect(params.length).toBeGreaterThan(3);
    });

    test('should support update with multiple WHERE conditions', () => {
      const ub = new UpdateBuilder('users');
      const { sql, params } = ub
        .set({ status: 'archived' })
        .where('age', '>', 60)
        .where('active', '=', false)
        .build();

      expect(sql).toContain('WHERE age > ? AND active = ?');
      expect(params).toEqual(['archived', 60, false]);
    });

    test('should update with WHERE IN', () => {
      const ub = new UpdateBuilder('users');
      const { sql, params } = ub
        .set({ status: 'verified' })
        .whereIn('id', [1, 2, 3])
        .build();

      expect(sql).toContain('WHERE id IN (?, ?, ?)');
      expect(params).toContain('verified');
    });
  });

  describe('DELETE with DeleteBuilder', () => {
    test('should build simple DELETE', () => {
      const db = new DeleteBuilder('users');
      const { sql, params } = db
        .where('id', '=', 1)
        .build();

      expect(sql).toBe('DELETE FROM users WHERE id = ?');
      expect(params).toEqual([1]);
    });

    test('should enforce WHERE clause for safety', () => {
      const db = new DeleteBuilder('users');
      expect(() => {
        db.build();
      }).toThrow('WHERE clause is required for DELETE');
    });

    test('should handle multiple WHERE conditions', () => {
      const db = new DeleteBuilder('logs');
      const { sql, params } = db
        .where('status', '=', 'deleted')
        .where('created_at', '<', '2026-01-01')
        .build();

      expect(sql).toContain('WHERE status = ? AND created_at < ?');
      expect(params).toEqual(['deleted', '2026-01-01']);
    });

    test('should support DELETE with IN operator', () => {
      const db = new DeleteBuilder('users');
      const { sql, params } = db
        .whereIn('id', [1, 2, 3, 4, 5])
        .build();

      expect(sql).toContain('WHERE id IN (?, ?, ?, ?, ?)');
      expect(params).toEqual([1, 2, 3, 4, 5]);
    });

    test('should support DELETE with BETWEEN', () => {
      const db = new DeleteBuilder('transactions');
      const { sql, params } = db
        .whereBetween('amount', 0, 10)
        .build();

      expect(sql).toContain('WHERE amount BETWEEN ? AND ?');
      expect(params).toEqual([0, 10]);
    });
  });

  describe('Fluent API Chaining', () => {
    test('should allow fluent chaining for SELECT', () => {
      const qb = new QueryBuilder('users');
      const result = qb
        .select(['id', 'name'])
        .where('age', '>', 18)
        .orderBy('name')
        .limit(10);

      expect(result).toBeInstanceOf(QueryBuilder);
      const { sql } = result.build();
      expect(sql).toContain('SELECT');
      expect(sql).toContain('WHERE');
      expect(sql).toContain('ORDER BY');
      expect(sql).toContain('LIMIT');
    });

    test('should allow fluent chaining for UPDATE', () => {
      const ub = new UpdateBuilder('users');
      const result = ub
        .set({ status: 'active' })
        .where('verified', '=', true);

      expect(result).toBeInstanceOf(UpdateBuilder);
    });

    test('should allow fluent chaining for DELETE', () => {
      const db = new DeleteBuilder('logs');
      const result = db
        .where('level', '=', 'DEBUG')
        .where('created_at', '<', '2026-01-01');

      expect(result).toBeInstanceOf(DeleteBuilder);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty column list', () => {
      const qb = new QueryBuilder('users');
      const { sql } = qb.select([]).build();
      expect(sql).toBe('SELECT * FROM users');
    });

    test('should handle special characters in values', () => {
      const ib = new InsertBuilder('posts');
      const { sql, params } = ib
        .values({ title: "O'Reilly's Book", content: 'Quote: "Hello"' })
        .build();

      expect(params).toContain("O'Reilly's Book");
      expect(params).toContain('Quote: "Hello"');
    });

    test('should handle numeric table and column names', () => {
      const qb = new QueryBuilder('table123');
      const { sql } = qb.select(['col1', 'col2']).build();
      expect(sql).toContain('table123');
    });

    test('should handle long WHERE IN lists', () => {
      const ids = Array.from({ length: 100 }, (_, i) => i + 1);
      const qb = new QueryBuilder('users');
      const { sql, params } = qb
        .select()
        .whereIn('id', ids)
        .build();

      expect(sql).toContain('IN (');
      expect(params.length).toBe(100);
    });
  });

  describe('SQL Injection Prevention', () => {
    test('should parameterize WHERE values', () => {
      const qb = new QueryBuilder('users');
      const malicious = "'; DROP TABLE users; --";
      const { sql, params } = qb
        .select()
        .where('name', '=', malicious)
        .build();

      expect(sql).toContain('WHERE name = ?');
      expect(params).toContain(malicious);
      expect(sql).not.toContain('DROP TABLE');
    });

    test('should parameterize INSERT values', () => {
      const ib = new InsertBuilder('users');
      const malicious = "admin'; --";
      const { sql, params } = ib
        .values({ name: malicious, email: 'test@example.com' })
        .build();

      expect(sql).toContain('VALUES');
      expect(params[0]).toBe(malicious);
      expect(sql).not.toContain(malicious);
    });

    test('should parameterize UPDATE values', () => {
      const ub = new UpdateBuilder('users');
      const malicious = "'; DELETE FROM users; --";
      const { sql, params } = ub
        .set({ status: malicious })
        .where('id', '=', 1)
        .build();

      expect(params).toContain(malicious);
      expect(sql).not.toContain(malicious);
    });
  });
});
