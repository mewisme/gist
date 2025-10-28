import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'sqlite.db');
const db = new Database(dbPath);

console.log('Starting migration to add user_followed notification type...\n');

try {
  db.exec('BEGIN TRANSACTION');

  console.log('1. Creating new notifications table with updated CHECK constraint...');

  db.exec(`
    CREATE TABLE notifications_new (
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

  console.log('2. Copying data from old table to new table...');

  db.exec(`
    INSERT INTO notifications_new (id, user_id, type, actor_id, gist_id, comment_id, metadata, read, created_at)
    SELECT id, user_id, type, actor_id, gist_id, comment_id, metadata, read, created_at
    FROM notifications
  `);

  console.log('3. Dropping old table...');
  db.exec('DROP TABLE notifications');

  console.log('4. Renaming new table...');
  db.exec('ALTER TABLE notifications_new RENAME TO notifications');

  console.log('5. Recreating indexes...');

  db.exec(`
    CREATE INDEX notifications_user_read_created_idx ON notifications(user_id, read, created_at)
  `);

  db.exec(`
    CREATE INDEX notifications_user_created_idx ON notifications(user_id, created_at)
  `);

  db.exec(`
    CREATE INDEX notifications_gist_idx ON notifications(gist_id)
  `);

  db.exec(`
    CREATE INDEX notifications_actor_idx ON notifications(actor_id)
  `);

  db.exec('COMMIT');

  console.log('\n✅ Migration completed successfully!');
  console.log('✅ user_followed notification type is now available');

} catch (error) {
  console.error('\n❌ Migration failed:', error);

  try {
    db.exec('ROLLBACK');
    console.log('Transaction rolled back');
  } catch (rollbackError) {
    console.error('Failed to rollback:', rollbackError);
  }

  process.exit(1);
} finally {
  db.close();
}

