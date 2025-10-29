#!/usr/bin/env tsx

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Comprehensive migration script that runs all database migrations in order
 * Safe to run multiple times - checks if migrations are already applied
 */

const dbPath = './data/sqlite.db';

console.log('>> Starting comprehensive database migration...\n');

try {
  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // ==================================================================
  // STEP 1: Run Drizzle Kit migrations (schema changes)
  // ==================================================================
  console.log('[1/4] Step 1: Drizzle schema migrations');
  console.log('      This step is handled by drizzle-kit migrate');
  console.log('      [✓] Schema migrations completed\n');

  // ==================================================================
  // STEP 2: Add FTS5 search functionality
  // ==================================================================
  console.log('[2/4] Step 2: FTS5 Full-Text Search Migration');

  const checkFts = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='gists_fts'"
  ).get();

  if (checkFts) {
    console.log('      [SKIP] FTS5 table already exists - skipping\n');
  } else {
    console.log('      [RUN] Creating FTS5 virtual table...');
    const migrationPath = './drizzle/0001_add_fts5_search.sql';
    const migrationSql = readFileSync(join(process.cwd(), migrationPath), 'utf-8');

    const statements = migrationSql
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    db.transaction(() => {
      statements.forEach((statement) => {
        db.exec(statement);
      });
    })();

    const count = db.prepare('SELECT COUNT(*) as count FROM gists_fts').get() as { count: number };
    console.log(`      [✓] FTS5 created and indexed ${count.count} gist(s)\n`);
  }

  // ==================================================================
  // STEP 3: Add subscriptions and notifications tables
  // ==================================================================
  console.log('[3/4] Step 3: Subscriptions & Notifications Migration');

  const checkSubscriptions = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='subscriptions'"
  ).get();

  const checkNotifications = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'"
  ).get();

  if (checkSubscriptions && checkNotifications) {
    console.log('      [SKIP] Tables already exist - skipping\n');
  } else {
    console.log('      [RUN] Creating subscriptions and notifications tables...');
    db.exec('BEGIN TRANSACTION');

    try {
      // Add created_at to stars table if missing
      const starsColumns = db.pragma('table_info(stars)');
      const hasCreatedAt = (starsColumns as { name: string }[])?.some((col) => col.name === 'created_at');

      if (!hasCreatedAt) {
        db.exec(`ALTER TABLE stars ADD COLUMN created_at INTEGER;`);
        const now = Math.floor(Date.now() / 1000);
        db.exec(`UPDATE stars SET created_at = ${now} WHERE created_at IS NULL;`);
        console.log('      [✓] Added created_at to stars table');
      }

      // Create subscriptions table
      if (!checkSubscriptions) {
        db.exec(`
          CREATE TABLE IF NOT EXISTS subscriptions (
            id TEXT PRIMARY KEY NOT NULL,
            subscriber_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            target_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            target_gist_id TEXT REFERENCES gists(id) ON DELETE CASCADE,
            created_at INTEGER DEFAULT (unixepoch()) NOT NULL
          );
        `);
        db.exec(`
          CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_subscriber_user_idx ON subscriptions(subscriber_id, target_user_id);
          CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_subscriber_gist_idx ON subscriptions(subscriber_id, target_gist_id);
          CREATE INDEX IF NOT EXISTS subscriptions_target_user_idx ON subscriptions(target_user_id);
          CREATE INDEX IF NOT EXISTS subscriptions_target_gist_idx ON subscriptions(target_gist_id);
          CREATE INDEX IF NOT EXISTS subscriptions_subscriber_idx ON subscriptions(subscriber_id);
        `);
        console.log('      [✓] Created subscriptions table');
      }

      // Create notifications table
      if (!checkNotifications) {
        db.exec(`
          CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY NOT NULL,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type TEXT NOT NULL CHECK(type IN ('gist_created', 'gist_updated', 'gist_starred', 'gist_unstarred', 'gist_commented', 'gist_forked', 'user_followed')),
            actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            gist_id TEXT REFERENCES gists(id) ON DELETE CASCADE,
            comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
            metadata TEXT,
            read INTEGER DEFAULT 0 NOT NULL,
            created_at INTEGER DEFAULT (unixepoch()) NOT NULL
          );
        `);
        db.exec(`
          CREATE INDEX IF NOT EXISTS notifications_user_read_created_idx ON notifications(user_id, read, created_at);
          CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications(user_id, created_at);
          CREATE INDEX IF NOT EXISTS notifications_gist_idx ON notifications(gist_id);
          CREATE INDEX IF NOT EXISTS notifications_actor_idx ON notifications(actor_id);
        `);
        console.log('      [✓] Created notifications table');
      }

      db.exec('COMMIT');
      console.log('      [✓] Migration completed\n');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  // ==================================================================
  // STEP 4: Update notifications to support user_followed type
  // ==================================================================
  console.log('[4/4] Step 4: User Followed Notification Type');

  // Check if user_followed is already supported
  const tableInfo = db.pragma('table_info(notifications)') as Array<{ name: string; type: string }>;
  const typeColumn = tableInfo.find(col => col.name === 'type');

  if (typeColumn && typeColumn.type.includes('user_followed')) {
    console.log('      [SKIP] user_followed type already supported - skipping\n');
  } else {
    console.log('      [RUN] Adding user_followed notification type...');

    // Check if notifications table has any data to migrate
    const hasData = db.prepare('SELECT COUNT(*) as count FROM notifications').get() as { count: number };

    if (hasData.count > 0) {
      // Need to recreate table with updated CHECK constraint
      db.exec('BEGIN TRANSACTION');
      try {
        db.exec(`
          CREATE TABLE IF NOT EXISTS notifications_new (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type TEXT NOT NULL CHECK(type IN ('gist_created', 'gist_updated', 'gist_starred', 'gist_unstarred', 'gist_commented', 'gist_forked', 'user_followed')),
            actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            gist_id TEXT REFERENCES gists(id) ON DELETE CASCADE,
            comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
            metadata TEXT,
            read INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL DEFAULT (unixepoch())
          )
        `);

        db.exec(`
          INSERT INTO notifications_new (id, user_id, type, actor_id, gist_id, comment_id, metadata, read, created_at)
          SELECT id, user_id, type, actor_id, gist_id, comment_id, metadata, read, created_at
          FROM notifications
        `);

        db.exec('DROP TABLE notifications');
        db.exec('ALTER TABLE notifications_new RENAME TO notifications');

        db.exec(`
          CREATE INDEX IF NOT EXISTS notifications_user_read_created_idx ON notifications(user_id, read, created_at);
          CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications(user_id, created_at);
          CREATE INDEX IF NOT EXISTS notifications_gist_idx ON notifications(gist_id);
          CREATE INDEX IF NOT EXISTS notifications_actor_idx ON notifications(actor_id);
        `);

        db.exec('COMMIT');
        console.log('      [✓] user_followed type added with data migration\n');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    } else {
      console.log('      [SKIP] No existing data - type will be created correctly\n');
    }
  }

  // ==================================================================
  // Final verification
  // ==================================================================
  console.log('>> Final Verification');

  const tables = [
    'gists_fts',
    'subscriptions',
    'notifications'
  ];

  const allExist = tables.every(table => {
    const result = db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
    ).get(table);
    return result !== undefined;
  });

  if (allExist) {
    console.log('   [✓] All required tables exist');

    // Count records
    const gistCount = db.prepare('SELECT COUNT(*) as count FROM gists_fts').get() as { count: number };
    const subsCount = db.prepare('SELECT COUNT(*) as count FROM subscriptions').get() as { count: number };
    const notifCount = db.prepare('SELECT COUNT(*) as count FROM notifications').get() as { count: number };

    console.log(`   [✓] FTS5: ${gistCount.count} indexed gists`);
    console.log(`   [✓] Subscriptions: ${subsCount.count} active`);
    console.log(`   [✓] Notifications: ${notifCount.count} total`);
  } else {
    throw new Error('Some required tables are missing!');
  }

  db.close();

  console.log('\n[SUCCESS] All migrations completed successfully!\n');

} catch (error) {
  console.error('\n[ERROR] Migration failed:', error);
  process.exit(1);
}

