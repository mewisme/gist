import { execSync } from 'child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Custom migration generator that includes FTS5 setup
 * This script:
 * 1. Runs drizzle-kit generate
 * 2. Adds IF NOT EXISTS to all CREATE statements in generated SQL files
 * 3. Checks if FTS5 setup exists in migrations
 * 4. If not, appends FTS5 setup to the latest migration
 */

/**
 * Adds IF NOT EXISTS to all CREATE statements in SQL content
 */
function addIfNotExistsToSql(sqlContent: string): string {
  let processed = sqlContent;

  // Skip if already processed (contains IF NOT EXISTS)
  if (processed.includes('CREATE TABLE IF NOT EXISTS') ||
    processed.includes('CREATE INDEX IF NOT EXISTS') ||
    processed.includes('CREATE UNIQUE INDEX IF NOT EXISTS')) {
    // Check if we need to process triggers
    if (!processed.includes('DROP TRIGGER IF EXISTS')) {
      // Process triggers only
      return addDropTriggerIfExists(processed);
    }
    return processed;
  }

  // Add IF NOT EXISTS to CREATE TABLE statements (handles backticks)
  processed = processed.replace(
    /CREATE TABLE (IF NOT EXISTS )?(`?)([^\s`]+)(`?)/g,
    (match, ifNotExists, prefix, name, suffix) => {
      // Skip if already has IF NOT EXISTS
      if (ifNotExists) return match;
      return `CREATE TABLE IF NOT EXISTS ${prefix}${name}${suffix}`;
    }
  );

  // Add IF NOT EXISTS to CREATE INDEX statements
  processed = processed.replace(
    /CREATE INDEX (IF NOT EXISTS )?(`?)([^\s`]+)(`?)/g,
    (match, ifNotExists, prefix, name, suffix) => {
      if (ifNotExists) return match;
      return `CREATE INDEX IF NOT EXISTS ${prefix}${name}${suffix}`;
    }
  );

  // Add IF NOT EXISTS to CREATE UNIQUE INDEX statements
  processed = processed.replace(
    /CREATE UNIQUE INDEX (IF NOT EXISTS )?(`?)([^\s`]+)(`?)/g,
    (match, ifNotExists, prefix, name, suffix) => {
      if (ifNotExists) return match;
      return `CREATE UNIQUE INDEX IF NOT EXISTS ${prefix}${name}${suffix}`;
    }
  );

  // Add IF NOT EXISTS to CREATE VIRTUAL TABLE statements
  processed = processed.replace(
    /CREATE VIRTUAL TABLE (IF NOT EXISTS )?([^\s]+)/g,
    (match, ifNotExists, name) => {
      if (ifNotExists) return match;
      return `CREATE VIRTUAL TABLE IF NOT EXISTS ${name}`;
    }
  );

  // Process triggers
  processed = addDropTriggerIfExists(processed);

  return processed;
}

/**
 * Adds DROP TRIGGER IF EXISTS before each CREATE TRIGGER statement
 */
function addDropTriggerIfExists(sqlContent: string): string {
  let processed = sqlContent;

  // Pattern to match CREATE TRIGGER statements with optional backticks
  const triggerPattern = /CREATE TRIGGER (`?)(\w+)(`?)\s+(AFTER|BEFORE|INSTEAD OF)\s+(INSERT|UPDATE|DELETE)/g;
  const triggers: Array<{ name: string; prefix: string; suffix: string; index: number }> = [];
  let match;

  // Find all CREATE TRIGGER statements
  while ((match = triggerPattern.exec(processed)) !== null) {
    const triggerName = match[2];
    const prefix = match[1] || '';
    const suffix = match[3] || '';

    // Check if DROP TRIGGER IF EXISTS already exists before this CREATE TRIGGER
    const startPos = Math.max(0, match.index - 300);
    const beforeTrigger = processed.substring(startPos, match.index);
    const dropPattern = new RegExp(
      `DROP TRIGGER IF EXISTS\\s+${prefix.replace(/`/g, '`?')}${triggerName}${suffix.replace(/`/g, '`?')}`,
      'i'
    );

    if (!dropPattern.test(beforeTrigger)) {
      triggers.push({
        name: triggerName,
        prefix,
        suffix,
        index: match.index
      });
    }
  }

  // Insert DROP TRIGGER IF EXISTS before each CREATE TRIGGER (in reverse order to preserve indices)
  for (let i = triggers.length - 1; i >= 0; i--) {
    const trigger = triggers[i];
    const formattedName = trigger.prefix
      ? `${trigger.prefix}${trigger.name}${trigger.suffix}`
      : trigger.name;
    const dropStatement = `DROP TRIGGER IF EXISTS ${formattedName};\n--> statement-breakpoint\n`;
    processed = processed.slice(0, trigger.index) + dropStatement + processed.slice(trigger.index);
  }

  return processed;
}

const FTS5_MIGRATION = `
-- FTS5 Full-Text Search Setup
--> statement-breakpoint

-- Drop existing FTS5 table if it exists (for regeneration)
DROP TABLE IF EXISTS gists_fts;
--> statement-breakpoint

-- Create FTS5 virtual table for full-text search on gists
CREATE VIRTUAL TABLE IF NOT EXISTS gists_fts USING fts5(
  gist_id UNINDEXED,
  title,
  description,
  owner_handle,
  owner_display_name,
  file_content,
  tokenize = 'porter unicode61'
);
--> statement-breakpoint

-- Populate FTS5 table with existing data
INSERT INTO gists_fts(gist_id, title, description, owner_handle, owner_display_name, file_content)
SELECT 
  g.id,
  COALESCE(g.title, ''),
  COALESCE(g.description, ''),
  COALESCE(u.handle, ''),
  COALESCE(u.display_name, ''),
  COALESCE(
    (SELECT GROUP_CONCAT(f.content, ' ') FROM files f WHERE f.gist_id = g.id),
    ''
  )
FROM gists g
LEFT JOIN users u ON g.owner_id = u.id;
--> statement-breakpoint

-- Drop existing triggers to avoid duplicates
DROP TRIGGER IF EXISTS gists_fts_insert;
--> statement-breakpoint
DROP TRIGGER IF EXISTS gists_fts_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS gists_fts_delete;
--> statement-breakpoint
DROP TRIGGER IF EXISTS users_fts_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS files_fts_insert;
--> statement-breakpoint
DROP TRIGGER IF EXISTS files_fts_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS files_fts_delete;
--> statement-breakpoint

-- Trigger: Insert new gist into FTS5 table
-- Note: SQLite doesn't support IF NOT EXISTS for triggers, so we use DROP IF EXISTS above
CREATE TRIGGER gists_fts_insert AFTER INSERT ON gists
BEGIN
  INSERT INTO gists_fts(gist_id, title, description, owner_handle, owner_display_name, file_content)
  SELECT 
    NEW.id,
    COALESCE(NEW.title, ''),
    COALESCE(NEW.description, ''),
    COALESCE(u.handle, ''),
    COALESCE(u.display_name, ''),
    ''
  FROM users u
  WHERE u.id = NEW.owner_id;
END;
--> statement-breakpoint

-- Trigger: Update gist in FTS5 table
CREATE TRIGGER gists_fts_update AFTER UPDATE ON gists
BEGIN
  UPDATE gists_fts
  SET 
    title = COALESCE(NEW.title, ''),
    description = COALESCE(NEW.description, ''),
    owner_handle = (SELECT COALESCE(handle, '') FROM users WHERE id = NEW.owner_id),
    owner_display_name = (SELECT COALESCE(display_name, '') FROM users WHERE id = NEW.owner_id)
  WHERE gist_id = NEW.id;
END;
--> statement-breakpoint

-- Trigger: Delete gist from FTS5 table
CREATE TRIGGER gists_fts_delete AFTER DELETE ON gists
BEGIN
  DELETE FROM gists_fts WHERE gist_id = OLD.id;
END;
--> statement-breakpoint

-- Trigger: Update FTS5 when user handle changes
CREATE TRIGGER users_fts_update AFTER UPDATE ON users
BEGIN
  UPDATE gists_fts
  SET 
    owner_handle = COALESCE(NEW.handle, ''),
    owner_display_name = COALESCE(NEW.display_name, '')
  WHERE gist_id IN (SELECT id FROM gists WHERE owner_id = NEW.id);
END;
--> statement-breakpoint

-- Trigger: Insert file content into FTS5
CREATE TRIGGER files_fts_insert AFTER INSERT ON files
BEGIN
  UPDATE gists_fts
  SET file_content = COALESCE(
    (SELECT GROUP_CONCAT(f.content, ' ') FROM files f WHERE f.gist_id = NEW.gist_id),
    ''
  )
  WHERE gist_id = NEW.gist_id;
END;
--> statement-breakpoint

-- Trigger: Update file content in FTS5
CREATE TRIGGER files_fts_update AFTER UPDATE ON files
BEGIN
  UPDATE gists_fts
  SET file_content = COALESCE(
    (SELECT GROUP_CONCAT(f.content, ' ') FROM files f WHERE f.gist_id = NEW.gist_id),
    ''
  )
  WHERE gist_id = NEW.gist_id;
END;
--> statement-breakpoint

-- Trigger: Delete file content from FTS5
CREATE TRIGGER files_fts_delete AFTER DELETE ON files
BEGIN
  UPDATE gists_fts
  SET file_content = COALESCE(
    (SELECT GROUP_CONCAT(f.content, ' ') FROM files f WHERE f.gist_id = OLD.gist_id),
    ''
  )
  WHERE gist_id = OLD.gist_id;
END;
`;

console.log('Running drizzle-kit generate...\n');

try {
  execSync('drizzle-kit generate', { stdio: 'inherit' });

  console.log('\nProcessing generated SQL files to add IF NOT EXISTS...\n');

  const drizzleDir = join(process.cwd(), 'drizzle');

  if (!existsSync(drizzleDir)) {
    console.log('No drizzle directory found. Migrations may not have been generated.');
    process.exit(0);
  }

  const files = readdirSync(drizzleDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migration files found.');
    process.exit(0);
  }

  // Process all SQL files to add IF NOT EXISTS
  console.log('Adding IF NOT EXISTS to CREATE statements...');
  for (const file of files) {
    const filePath = join(drizzleDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const processed = addIfNotExistsToSql(content);

    if (content !== processed) {
      writeFileSync(filePath, processed, 'utf-8');
      console.log(`  ✓ Updated: ${file}`);
    }
  }

  console.log('\nChecking for FTS5 setup in migrations...\n');

  const latestMigration = files[files.length - 1];
  const migrationPath = join(drizzleDir, latestMigration);

  console.log(`Latest migration: ${latestMigration}`);

  const migrationContent = readFileSync(migrationPath, 'utf-8');

  if (migrationContent.includes('gists_fts')) {
    console.log('✓ FTS5 setup already exists in migration');
    console.log('\nMigration generation complete!');
    process.exit(0);
  }

  console.log('Adding FTS5 setup to migration...');
  const updatedContent = migrationContent + FTS5_MIGRATION;
  writeFileSync(migrationPath, updatedContent, 'utf-8');

  console.log('✓ FTS5 setup added to migration');
  console.log(`✓ Updated: ${latestMigration}`);
  console.log('\n✓ Migration generation complete with FTS5 support!');
  console.log('\nNext step: Run `pnpm run db:migrate` to apply migrations');

} catch (error) {
  console.error('Error during migration generation:', error);
  process.exit(1);
}

