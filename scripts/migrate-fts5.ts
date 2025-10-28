import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Migration script to add FTS5 search to the database
 * This script applies the FTS5 migration SQL file
 */

const dbPath = './data/sqlite.db';
const migrationPath = './drizzle/0001_add_fts5_search.sql';

console.log('Starting FTS5 migration...');

try {
  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const checkTable = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='gists_fts'"
  ).get();

  if (checkTable) {
    console.log('FTS5 table already exists. Migration may have already been applied.');
    console.log('Skipping migration to avoid errors.');
    db.close();
    process.exit(0);
  }

  const migrationSql = readFileSync(join(process.cwd(), migrationPath), 'utf-8');

  const statements = migrationSql
    .split('--> statement-breakpoint')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Found ${statements.length} SQL statements to execute`);

  db.transaction(() => {
    statements.forEach((statement, index) => {
      try {
        console.log(`Executing statement ${index + 1}/${statements.length}...`);
        db.exec(statement);
      } catch (error) {
        console.error(`Error executing statement ${index + 1}:`, error);
        console.error('Statement:', statement.substring(0, 200) + '...');
        throw error;
      }
    });
  })();

  console.log('FTS5 migration completed successfully!');
  console.log('Full-text search is now enabled.');

  const verify = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='gists_fts'"
  ).get();

  if (verify) {
    console.log('✓ FTS5 virtual table created successfully');

    const count = db.prepare('SELECT COUNT(*) as count FROM gists_fts').get() as { count: number };
    console.log(`✓ Indexed ${count.count} gist(s)`);
  } else {
    console.error('✗ FTS5 table was not created');
  }

  db.close();
  console.log('Migration complete!');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}

