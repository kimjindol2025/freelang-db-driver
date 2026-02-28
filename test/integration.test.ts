/**
 * @freelang/database-driver - Integration Tests
 * End-to-end tests combining QueryBuilder with SQLiteDatabase
 */

import { SQLiteDatabase } from '../src/sqlite';
import { QueryBuilder, InsertBuilder, UpdateBuilder, DeleteBuilder } from '../src/query-builder';
import fs from 'fs';

describe('Integration Tests - QueryBuilder + SQLiteDatabase', () => {
  let db: SQLiteDatabase;
  const testDbPath = '/tmp/test-integration-db.sqlite';

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = new SQLiteDatabase(testDbPath);

    // Create test schema
    db.run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        age INTEGER,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE posts (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);
  });

  afterEach(() => {
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

  describe('Complete CRUD Operations', () => {
    test('should perform complete CRUD cycle', () => {
      // CREATE
      const insertBuilder = new InsertBuilder('users');
      const { sql: insertSql, params: insertParams } = insertBuilder
        .values({ username: 'alice', email: 'alice@example.com', age: 28 })
        .build();

      const insertResult = db.run(insertSql, insertParams);
      expect(insertResult.changes).toBe(1);
      const userId = Number(insertResult.lastInsertRowid);

      // READ
      const selectBuilder = new QueryBuilder('users');
      const { sql: selectSql, params: selectParams } = selectBuilder
        .select(['id', 'username', 'email', 'age'])
        .where('id', '=', userId)
        .build();

      const user = db.get<any>(selectSql, selectParams);
      expect(user).toBeDefined();
      expect(user?.username).toBe('alice');

      // UPDATE
      const updateBuilder = new UpdateBuilder('users');
      const { sql: updateSql, params: updateParams } = updateBuilder
        .set({ age: 29 })
        .where('id', '=', userId)
        .build();

      const updateResult = db.run(updateSql, updateParams);
      expect(updateResult.changes).toBe(1);

      // Verify UPDATE
      const updatedUser = db.get<any>(selectSql, [userId]);
      expect(updatedUser?.age).toBe(29);

      // DELETE
      const deleteBuilder = new DeleteBuilder('users');
      const { sql: deleteSql, params: deleteParams } = deleteBuilder
        .where('id', '=', userId)
        .build();

      const deleteResult = db.run(deleteSql, deleteParams);
      expect(deleteResult.changes).toBe(1);

      // Verify DELETE
      const deletedUser = db.get<any>(selectSql, [userId]);
      expect(deletedUser).toBeUndefined();
    });

    test('should handle batch operations with QueryBuilder', () => {
      const users = [
        { username: 'alice', email: 'alice@example.com', age: 28 },
        { username: 'bob', email: 'bob@example.com', age: 32 },
        { username: 'charlie', email: 'charlie@example.com', age: 25 }
      ];

      // Bulk insert
      for (const user of users) {
        const ib = new InsertBuilder('users');
        const { sql, params } = ib.values(user).build();
        db.run(sql, params);
      }

      // Bulk select
      const qb = new QueryBuilder('users');
      const { sql, params } = qb
        .select()
        .where('age', '>', 25)
        .orderBy('age', false)
        .build();

      const results = db.query<any>(sql, params);
      expect(results.length).toBe(2);
      expect(results[0].age).toBe(32);
    });
  });

  describe('Complex Queries', () => {
    test('should handle JOIN queries', () => {
      // Insert users
      const user1 = new InsertBuilder('users');
      const { sql: userSql, params: userParams } = user1
        .values({ username: 'alice', email: 'alice@example.com' })
        .build();
      const result1 = db.run(userSql, userParams);
      const userId1 = Number(result1.lastInsertRowid);

      // Insert posts
      const post1 = new InsertBuilder('posts');
      const { sql: postSql, params: postParams } = post1
        .values({ user_id: userId1, title: 'First Post', content: 'Content here' })
        .build();
      db.run(postSql, postParams);

      // Query with JOIN
      const result = db.query<any>(`
        SELECT u.username, u.email, p.title, p.content
        FROM users u
        INNER JOIN posts p ON u.id = p.user_id
        WHERE u.id = ?
      `, [userId1]);

      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('alice');
      expect(result[0].title).toBe('First Post');
    });

    test('should handle aggregation queries', () => {
      // Insert test data
      const userIds = [];
      for (let i = 0; i < 3; i++) {
        const ib = new InsertBuilder('users');
        const { sql, params } = ib
          .values({ username: `user${i}`, email: `user${i}@example.com` })
          .build();
        const result = db.run(sql, params);
        userIds.push(Number(result.lastInsertRowid));
      }

      // Create posts
      for (const userId of userIds) {
        for (let i = 0; i < 2; i++) {
          const pb = new InsertBuilder('posts');
          const { sql, params } = pb
            .values({ user_id: userId, title: `Post ${i}` })
            .build();
          db.run(sql, params);
        }
      }

      // Aggregate query
      const result = db.query<any>(`
        SELECT u.username, COUNT(p.id) as post_count
        FROM users u
        LEFT JOIN posts p ON u.id = p.user_id
        GROUP BY u.id
        ORDER BY post_count DESC
      `);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('post_count');
      expect(result[0].post_count).toBe(2);
    });

    test('should handle subqueries with QueryBuilder results', () => {
      // Insert users
      const ib = new InsertBuilder('users');
      for (let i = 0; i < 5; i++) {
        const { sql, params } = new InsertBuilder('users')
          .values({ username: `user${i}`, email: `user${i}@example.com`, age: 20 + i })
          .build();
        db.run(sql, params);
      }

      // Get users older than 22
      const result = db.query<any>(`
        SELECT *
        FROM users
        WHERE age > ?
        ORDER BY age
      `, [22]);

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((u: any) => u.age > 22)).toBe(true);
    });
  });

  describe('Transaction Integration', () => {
    test('should execute QueryBuilder queries within transaction', () => {
      const transactionResult = db.transaction((tx) => {
        // Insert multiple users
        for (let i = 0; i < 3; i++) {
          const ib = new InsertBuilder('users');
          const { sql, params } = ib
            .values({ username: `user${i}`, email: `user${i}@example.com` })
            .build();
          tx.run(sql, params);
        }

        // Query within transaction
        const qb = new QueryBuilder('users');
        const { sql, params } = qb.select().build();
        const users = tx.query<any>(sql, params);

        return users.length;
      });

      expect(transactionResult).toBe(3);

      // Verify outside transaction
      const qb = new QueryBuilder('users');
      const { sql, params } = qb.select().build();
      const users = db.query<any>(sql, params);
      expect(users).toHaveLength(3);
    });

    test('should rollback transaction on error', () => {
      // Insert initial user
      const ib = new InsertBuilder('users');
      const { sql, params } = ib
        .values({ username: 'initial', email: 'initial@example.com' })
        .build();
      db.run(sql, params);

      // Attempt transaction with error
      try {
        db.transaction((tx) => {
          const insertIb = new InsertBuilder('users');
          const { sql: insertSql, params: insertParams } = insertIb
            .values({ username: 'new', email: 'new@example.com' })
            .build();
          tx.run(insertSql, insertParams);

          // Trigger error
          throw new Error('Simulated error');
        });
      } catch (e) {
        // Expected
      }

      // Verify only initial user exists
      const qb = new QueryBuilder('users');
      const { sql: selectSql, params: selectParams } = qb.select().build();
      const users = db.query<any>(selectSql, selectParams);
      expect(users).toHaveLength(1);
      expect(users[0].username).toBe('initial');
    });
  });

  describe('Real-world Scenarios', () => {
    test('should handle user registration flow', () => {
      const newUser = { username: 'johndoe', email: 'john@example.com', age: 30 };

      // Registration (INSERT)
      const ib = new InsertBuilder('users');
      const { sql: insertSql, params: insertParams } = ib.values(newUser).build();
      const result = db.run(insertSql, insertParams);
      const userId = Number(result.lastInsertRowid);

      // Verify (SELECT)
      const qb = new QueryBuilder('users');
      const { sql: selectSql, params: selectParams } = qb
        .select()
        .where('id', '=', userId)
        .build();
      const user = db.get<any>(selectSql, selectParams);
      expect(user?.username).toBe('johndoe');

      // Update profile (UPDATE)
      const ub = new UpdateBuilder('users');
      const { sql: updateSql, params: updateParams } = ub
        .set({ age: 31 })
        .where('id', '=', userId)
        .build();
      db.run(updateSql, updateParams);

      // Verify update
      const updated = db.get<any>(selectSql, selectParams);
      expect(updated?.age).toBe(31);
    });

    test('should handle blog post creation and retrieval', () => {
      // Create user
      const ib = new InsertBuilder('users');
      const { sql: userSql, params: userParams } = ib
        .values({ username: 'blogger', email: 'blog@example.com' })
        .build();
      const userResult = db.run(userSql, userParams);
      const userId = Number(userResult.lastInsertRowid);

      // Create posts
      const postTitles = ['First Post', 'Second Post', 'Third Post'];
      for (const title of postTitles) {
        const pb = new InsertBuilder('posts');
        const { sql: postSql, params: postParams } = pb
          .values({ user_id: userId, title, content: `Content for ${title}` })
          .build();
        db.run(postSql, postParams);
      }

      // Retrieve user's posts
      const result = db.query<any>(`
        SELECT p.title, p.content, u.username
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE u.id = ?
        ORDER BY p.created_at
      `, [userId]);

      expect(result).toHaveLength(3);
      expect(result.map((p: any) => p.title)).toEqual(postTitles);
    });

    test('should handle pagination with LIMIT and OFFSET', () => {
      // Insert 25 users
      for (let i = 0; i < 25; i++) {
        const ib = new InsertBuilder('users');
        const { sql, params } = ib
          .values({ username: `user${i}`, email: `user${i}@example.com`, age: 20 + (i % 50) })
          .build();
        db.run(sql, params);
      }

      // Page 1 (limit 10)
      const qb1 = new QueryBuilder('users');
      const { sql: sql1, params: params1 } = qb1
        .select()
        .orderBy('id')
        .limit(10)
        .offset(0)
        .build();
      const page1 = db.query<any>(sql1, params1);
      expect(page1).toHaveLength(10);

      // Page 2 (limit 10)
      const qb2 = new QueryBuilder('users');
      const { sql: sql2, params: params2 } = qb2
        .select()
        .orderBy('id')
        .limit(10)
        .offset(10)
        .build();
      const page2 = db.query<any>(sql2, params2);
      expect(page2).toHaveLength(10);

      // Verify different pages
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });

  describe('Performance Scenarios', () => {
    test('should handle bulk insert efficiently', () => {
      const startTime = Date.now();

      db.transaction((tx) => {
        for (let i = 0; i < 100; i++) {
          const ib = new InsertBuilder('users');
          const { sql, params } = ib
            .values({ username: `user${i}`, email: `user${i}@example.com`, age: 20 + (i % 50) })
            .build();
          tx.run(sql, params);
        }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all records inserted
      const result = db.query<any>('SELECT COUNT(*) as count FROM users');
      expect(result[0].count).toBe(100);

      // Should complete in reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000);
    });

    test('should handle complex SELECT efficiently', () => {
      // Prepare data
      for (let i = 0; i < 50; i++) {
        const ib = new InsertBuilder('users');
        const { sql, params } = ib
          .values({ username: `user${i}`, email: `user${i}@example.com`, age: 20 + (i % 50) })
          .build();
        db.run(sql, params);
      }

      const startTime = Date.now();

      const result = db.query<any>(`
        SELECT username, email, age
        FROM users
        WHERE age > ?
        ORDER BY age DESC
        LIMIT 10
      `, [30]);

      const endTime = Date.now();

      expect(result.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
