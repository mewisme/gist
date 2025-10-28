import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from './schema';

let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;

try {
  sqlite = new Database('./data/sqlite.db');

  sqlite.pragma('journal_mode = WAL');

  sqlite.pragma('foreign_keys = ON');

  db = drizzle(sqlite, { schema });
} catch (error) {
  console.warn('Database connection failed during initialization:', error);
  sqlite = new Database(':memory:');
  db = drizzle(sqlite, { schema });
}

export { db, sqlite };

export * from './schema';
