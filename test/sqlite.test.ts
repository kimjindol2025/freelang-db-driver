/**
 * @freelang/database-driver - SQLiteDatabase Tests
 * Comprehensive test suite for SQLite driver
 */

import { SQLiteDatabase } from '../src/sqlite';
import { QueryBuilder, InsertBuilder, UpdateBuilder, DeleteBuilder } from '../src/query-builder';
import fs from 'fs';
import path from 'path';

describe('SQLiteDatabase', () => {
  let db: SQLiteDatabase;
  const testDbPath = '/tmp/test-freelang-db.sqlite';

  beforeEach(() => {
    // Clean up previous test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    // Create fresh database
    db = new SQLiteDatabase(testDbPath);
  });

  afterEach(() => {
    // Clean up
    if (db && !db.isClosed()) {
      db.close();
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    if (fs.existsSync(testDbPath + '-wal')) {
      fs.unlinkSync(testDbPath + '-wal');
    }
    if (fs.existsSync(testDbPath + '-shm')) {
      fs.unlinkSync(testDbPath + '-shm');
    }
  });

  describe('Basic Operations', () => {
    test('should create database file', () => {
      expect(fs.existsSync(testDbPath)).toBe(true);
    });

    test('should create table', () => {
      db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          age INTEGER
        )
      `);

      const tables = db.getTables();
      expect(tables).toContain('users');
    });

    test('should insert data with run()', () => {
      db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT
        )
      `);

      const result = db.run(
        'INSERT INTO users (name, email) VALUES (?, ?)',
        ['Alice', 'alice@example.com']
      );

      expect(result.changes).toBe(1);
      expect(typeof result.lastInsertRowid).toBe('number');
    });

    test('should query all rows', () => {
      db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT,
          age INTEGER
        )
      `);

      db.run('INSERT INTO users (name, age) VALUES (?, ?)', ['Alice', 30]);
      db.run('INSERT INTO users (name, age) VALUES (?, ?)', ['Bob', 25]);
      db.run('INSERT INTO users (name, age) VALUES (?, ?)', ['Charlie', 35]);

      const result = db.query<any>('SELECT * FROM users');
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(expect.objectContaining({ name: 'Alice', age: 30 }));
    });

    test('should get single row', () => {
      db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT,
          email TEXT
        )
      `);

      db.run('INSERT INTO users (name, email) VALUES (?, ?)', ['Alice', 'alice@example.com']);
      db.run('INSERT INTO users (name, email) VALUES (?, ?)', ['Bob', 'bob@example.com']);

      const result = db.get<any>('SELECT * FROM users WHERE name = ?', ['Alice']);
      expect(result).toBeDefined();
      expect(result).toEqual(expect.objectContaining({ name: 'Alice', email: 'alice@example.com' }));
    });

    test('should get undefined for non-existent row', () => {
      db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT
        )
      `);

      const result = db.get<any>('SELECT * FROM users WHERE id = ?', [999]);
      expect(result).toBeUndefined();
    });

    test('should update rows', () => {
      db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT,
          age INTEGER
        )
      `);

      db.run('INSERT INTO users (name, age) VALUES (?, ?)', ['Alice', 30]);
      db.run('INSERT INTO users (name, age) VALUES (?, ?)', ['Bob', 25]);

      const result = db.run('UPDATE users SET age = ? WHERE name = ?', [31, 'Alice']);
      expect(result.changes).toBe(1);

      const updated = db.get<any>('SELECT * FROM users WHERE name = ?', ['Alice']);
      expect(updated?.age).toBe(31);
    });

    test('should delete rows', () => {
      db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT
        )
      `);

      db.run('INSERT INTO users (name) VALUES (?)', ['Alice']);
      db.run('INSERT INTO users (name) VALUES (?)', ['Bob']);

      const result = db.run('DELETE FROM users WHERE name = ?', ['Alice']);
      expect(result.changes).toBe(1);

      const remaining = db.query<any>('SELECT * FROM users');
      expect(remaining).toHaveLength(1);
      expect(remaining[0].name).toBe('Bob');
    });
  });

  describe('Transactions', () => {
    test('should execute transaction successfully', () => {
      db.run(`
        CREATE TABLE accounts (
          id INTEGER PRIMARY KEY,
          name TEXT,
          balance REAL
        )
      `);

      const result = db.transaction((tx) => {
        tx.run('INSERT INTO accounts (name, balance) VALUES (?, ?)', ['Alice', 1000]);
        tx.run('INSERT INTO accounts (name, balance) VALUES (?, ?)', ['Bob', 500]);
        const count = tx.query('SELECT COUNT(*) as count FROM accounts')[0] as { count: number };
        return count.count;
      });

      expect(result).toBe(2);
      const accounts = db.query<any>('SELECT * FROM accounts');
      expect(accounts).toHaveLength(2);
    });

    test('should rollback on error in transaction', () => {
      db.run(`
        CREATE TABLE accounts (
          id INTEGER PRIMARY KEY,
          name TEXT,
          balance REAL
        )
      `);

      db.run('INSERT INTO accounts (name, balance) VALUES (?, ?)', ['Alice', 1000]);

      try {
        db.transaction((tx) => {
          tx.run('UPDATE accounts SET balance = ? WHERE name = ?', [500, 'Alice']);
          throw new Error('Test error');
        });
      } catch (e) {
        // Expected error
      }

      // Due to transaction rollback, balance should remain 1000
      const account = db.get<any>('SELECT * FROM accounts WHERE name = ?', ['Alice']);
      expect(account?.balance).toBe(1000);
    });

    test('should handle nested transaction scopes', () => {
      db.run(`
        CREATE TABLE items (
          id INTEGER PRIMARY KEY,
          name TEXT,
          quantity INTEGER
        )
      `);

      const result = db.transaction((tx) => {
        tx.run('INSERT INTO items (name, quantity) VALUES (?, ?)', ['Item1', 100]);
        const item1 = tx.get('SELECT * FROM items WHERE name = ?', ['Item1']);

        tx.run('INSERT INTO items (name, quantity) VALUES (?, ?)', ['Item2', 200]);
        const items = tx.query('SELECT * FROM items');

        return { item1, items };
      });

      expect(result.item1).toBeDefined();
      expect(result.items).toHaveLength(2);
    });
  });

  describe('Parameterized Queries', () => {
    test('should prevent SQL injection with parameterized queries', () => {
      db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT,
          email TEXT
        )
      `);

      db.run('INSERT INTO users (name, email) VALUES (?, ?)', ['Alice', 'alice@example.com']);

      // Attempt SQL injection
      const malicious = "' OR '1'='1";
      const result = db.query<any>('SELECT * FROM users WHERE name = ?', [malicious]);

      expect(result).toHaveLength(0);
    });

    test('should handle multiple parameters', () => {
      db.run(`
        CREATE TABLE products (
          id INTEGER PRIMARY KEY,
          name TEXT,
          price REAL,
          stock INTEGER
        )
      `);

      db.run(
        'INSERT INTO products (name, price, stock) VALUES (?, ?, ?)',
        ['Widget', 19.99, 100]
      );

      const result = db.get<any>(
        'SELECT * FROM products WHERE name = ? AND price > ? AND stock >= ?',
        ['Widget', 10, 50]
      );

      expect(result).toBeDefined();
      expect(result?.name).toBe('Widget');
    });

    test('should handle null parameters', () => {
      db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT,
          email TEXT
        )
      `);

      db.run('INSERT INTO users (name, email) VALUES (?, ?)', ['Alice', null]);

      const result = db.get<any>('SELECT * FROM users WHERE email IS ?', [null]);
      expect(result).toBeDefined();
      expect(result?.email).toBeNull();
    });
  });

  describe('Type Generics', () => {
    interface User {
      id: number;
      name: string;
      email: string;
      age?: number;
    }

    test('should properly type generic queries', () => {
      db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT,
          email TEXT,
          age INTEGER
        )
      `);

      db.run('INSERT INTO users (name, email, age) VALUES (?, ?, ?)', ['Alice', 'alice@example.com', 30]);

      const users = db.query<User>('SELECT * FROM users');
      expect(users[0].name).toBe('Alice');
      expect(typeof users[0].age).toBe('number');

      const user = db.get<User>('SELECT * FROM users WHERE id = ?', [1]);
      expect(user?.email).toBe('alice@example.com');
    });
  });

  describe('Database Information', () => {
    test('should return table count', () => {
      db.run('CREATE TABLE users (id INTEGER PRIMARY KEY)');
      db.run('CREATE TABLE products (id INTEGER PRIMARY KEY)');

      const tables = db.getTables();
      expect(tables.length).toBeGreaterThanOrEqual(2);
      expect(tables).toContain('users');
      expect(tables).toContain('products');
    });

    test('should return database stats', () => {
      db.run('CREATE TABLE users (id INTEGER PRIMARY KEY)');
      db.run('INSERT INTO users VALUES (1)');

      const stats = db.stats();
      expect(stats).toHaveProperty('tables');
      expect(stats).toHaveProperty('journalMode');
      expect(stats.tables).toBeGreaterThanOrEqual(1);
    });

    test('should check if table exists', () => {
      db.run('CREATE TABLE users (id INTEGER PRIMARY KEY)');

      expect(db.tableExists('users')).toBe(true);
      expect(db.tableExists('nonexistent')).toBe(false);
    });
  });

  describe('Connection Management', () => {
    test('should close database', () => {
      db.close();
      expect(db.isClosed()).toBe(true);
    });

    test('should throw error when using closed database', () => {
      db.run('CREATE TABLE users (id INTEGER PRIMARY KEY)');
      db.close();

      expect(() => {
        db.query<any>('SELECT * FROM users');
      }).toThrow();
    });

    test('should work with in-memory database', () => {
      const memDb = new SQLiteDatabase(':memory:');
      memDb.run('CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)');
      memDb.run('INSERT INTO test (value) VALUES (?)', ['test']);

      const result = memDb.query('SELECT * FROM test');
      expect(result).toHaveLength(1);

      memDb.close();
    });
  });

  describe('Error Handling', () => {
    test('should throw on invalid SQL', () => {
      expect(() => {
        db.query<any>('INVALID SQL SYNTAX');
      }).toThrow();
    });

    test('should throw on query after close', () => {
      db.close();
      expect(() => {
        db.query<any>('SELECT 1');
      }).toThrow('Database is closed');
    });

    test('should throw on type mismatch in insert', () => {
      db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          email TEXT UNIQUE
        )
      `);

      db.run('INSERT INTO users (email) VALUES (?)', ['test@example.com']);

      expect(() => {
        db.run('INSERT INTO users (email) VALUES (?)', ['test@example.com']);
      }).toThrow();
    });
  });

  describe('Bulk Operations', () => {
    test('should insert multiple rows', () => {
      db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT
        )
      `);

      const users = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
      for (const name of users) {
        db.run('INSERT INTO users (name) VALUES (?)', [name]);
      }

      const result = db.query<any>('SELECT * FROM users');
      expect(result).toHaveLength(5);
    });

    test('should aggregate data', () => {
      db.run(`
        CREATE TABLE sales (
          id INTEGER PRIMARY KEY,
          product TEXT,
          amount REAL
        )
      `);

      db.run('INSERT INTO sales (product, amount) VALUES (?, ?)', ['Widget', 100]);
      db.run('INSERT INTO sales (product, amount) VALUES (?, ?)', ['Widget', 150]);
      db.run('INSERT INTO sales (product, amount) VALUES (?, ?)', ['Gadget', 200]);

      const result = db.query<any>(`
        SELECT product, SUM(amount) as total
        FROM sales
        GROUP BY product
        ORDER BY total DESC
      `);

      expect(result).toHaveLength(2);
      expect(result[0].product).toBe('Gadget');
    });

    test('should join tables', () => {
      db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT
        )
      `);
      db.run(`
        CREATE TABLE orders (
          id INTEGER PRIMARY KEY,
          user_id INTEGER,
          total REAL
        )
      `);

      db.run('INSERT INTO users (name) VALUES (?)', ['Alice']);
      db.run('INSERT INTO orders (user_id, total) VALUES (?, ?)', [1, 100]);
      db.run('INSERT INTO orders (user_id, total) VALUES (?, ?)', [1, 200]);

      const result = db.query<any>(`
        SELECT u.name, COUNT(o.id) as order_count
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        GROUP BY u.id
      `);

      expect(result).toHaveLength(1);
      expect(result[0].order_count).toBe(2);
    });
  });
});
