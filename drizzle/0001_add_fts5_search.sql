-- Create FTS5 virtual table for full-text search on gists
CREATE VIRTUAL TABLE gists_fts USING fts5(
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

-- Trigger: Insert new gist into FTS5 table
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

