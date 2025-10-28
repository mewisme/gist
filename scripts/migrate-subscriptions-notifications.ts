import Database from 'better-sqlite3';

/**
 * Migration script to add subscriptions and notifications tables
 * Run this script after updating the schema
 */

const dbPath = './data/sqlite.db';

console.log('Starting subscriptions and notifications migration...');

try {
  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const checkSubscriptionsTable = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='subscriptions'"
  ).get();

  const checkNotificationsTable = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'"
  ).get();

  if (checkSubscriptionsTable && checkNotificationsTable) {
    console.log('Subscriptions and notifications tables already exist.');
    console.log('Skipping migration to avoid errors.');
    db.close();
    process.exit(0);
  }

  console.log('Creating subscriptions and notifications tables...');

  db.exec('BEGIN TRANSACTION');

  try {
    console.log('Updating stars table...');
    const starsColumns = db.pragma('table_info(stars)');
    const hasCreatedAt = (starsColumns as { name: string }[])?.some((col) => col.name === 'created_at');

    if (!hasCreatedAt) {
      db.exec(`
        ALTER TABLE stars ADD COLUMN created_at INTEGER;
      `);

      const now = Math.floor(Date.now() / 1000);
      db.exec(`
        UPDATE stars SET created_at = ${now} WHERE created_at IS NULL;
      `);

      console.log('  ✓ Added created_at column to stars table');
    } else {
      console.log('  ✓ stars table already has created_at column');
    }

    if (!checkSubscriptionsTable) {
      db.exec(`
        CREATE TABLE subscriptions (
          id TEXT PRIMARY KEY NOT NULL,
          subscriber_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          target_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          target_gist_id TEXT REFERENCES gists(id) ON DELETE CASCADE,
          created_at INTEGER DEFAULT (unixepoch()) NOT NULL
        );
      `);
      console.log('  ✓ Created subscriptions table');

      db.exec(`
        CREATE UNIQUE INDEX subscriptions_subscriber_user_idx ON subscriptions(subscriber_id, target_user_id);
        CREATE UNIQUE INDEX subscriptions_subscriber_gist_idx ON subscriptions(subscriber_id, target_gist_id);
        CREATE INDEX subscriptions_target_user_idx ON subscriptions(target_user_id);
        CREATE INDEX subscriptions_target_gist_idx ON subscriptions(target_gist_id);
        CREATE INDEX subscriptions_subscriber_idx ON subscriptions(subscriber_id);
      `);
      console.log('  ✓ Created subscriptions indexes');
    }

    if (!checkNotificationsTable) {
      db.exec(`
        CREATE TABLE notifications (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type TEXT NOT NULL CHECK(type IN ('gist_created', 'gist_updated', 'gist_starred', 'gist_unstarred', 'gist_commented', 'gist_forked')),
          actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          gist_id TEXT REFERENCES gists(id) ON DELETE CASCADE,
          comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
          metadata TEXT,
          read INTEGER DEFAULT 0 NOT NULL,
          created_at INTEGER DEFAULT (unixepoch()) NOT NULL
        );
      `);
      console.log('  ✓ Created notifications table');

      db.exec(`
        CREATE INDEX notifications_user_read_created_idx ON notifications(user_id, read, created_at);
        CREATE INDEX notifications_user_created_idx ON notifications(user_id, created_at);
        CREATE INDEX notifications_gist_idx ON notifications(gist_id);
        CREATE INDEX notifications_actor_idx ON notifications(actor_id);
      `);
      console.log('  ✓ Created notifications indexes');
    }

    db.exec('COMMIT');
    console.log('\n✅ Migration completed successfully!');
    console.log('\nNew tables created:');
    console.log('  - subscriptions (for user and gist subscriptions)');
    console.log('  - notifications (for user notifications)');
    console.log('\nOptimized indexes created for:');
    console.log('  - Fast subscription lookups');
    console.log('  - Efficient notification queries (read/unread, pagination)');
    console.log('  - Preventing duplicate subscriptions');

  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  db.close();

} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}

