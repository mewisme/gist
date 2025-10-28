# Database Migrations in Docker Deployments

This guide explains how to manage database migrations when deploying with Docker, especially when your SQLite database is stored in a persistent volume.

## Table of Contents

1. [Overview](#overview)
2. [Automatic Migrations on Startup](#automatic-migrations-on-startup)
3. [Manual Migration Methods](#manual-migration-methods)
4. [Migration Scripts](#migration-scripts)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Overview

Your application uses **SQLite** with **Drizzle ORM** and has multiple migration types:

1. **Drizzle Schema Migrations** - Generated schema changes (`drizzle-kit migrate`)
2. **Custom Migrations** - TypeScript scripts for complex data migrations:
   - FTS5 full-text search
   - Subscriptions and notifications
   - User followed notification type

The database is stored in a Docker volume (`gist_data:/app/data`), which persists across container restarts.

---

## Automatic Migrations on Startup

### Default Behavior

The Docker container **automatically runs all migrations** every time it starts:

```dockerfile
# Dockerfile runs this on startup:
pnpm run db:migrate:all
```

This means:
- ✅ Fresh deployments get a fully migrated database
- ✅ Updates automatically apply new migrations
- ✅ Safe to run multiple times (migrations are idempotent)
- ✅ No manual intervention needed

### Deployment Process

When you deploy a new version:

```bash
# Pull the latest image
docker-compose pull

# Restart the container (migrations run automatically)
docker-compose up -d

# Check migration logs
docker-compose logs -f gist
```

You'll see output like:
```
🚀 Running database migrations...
📦 Step 1: Drizzle schema migrations
   ✓ Schema migrations completed
📦 Step 2: FTS5 Full-Text Search Migration
   ⏭️  FTS5 table already exists - skipping
📦 Step 3: Subscriptions & Notifications Migration
   ⏭️  Tables already exist - skipping
...
✅ All migrations completed successfully!
🚀 Starting application...
```

---

## Manual Migration Methods

Sometimes you need to run migrations manually (e.g., for testing or troubleshooting).

### Method 1: Run Migration in Running Container

Execute migrations without restarting:

```bash
# Enter the container
docker exec -it gist sh

# Run all migrations
pnpm run db:migrate:all

# Or run individual migrations:
pnpm run db:migrate              # Drizzle schema only
tsx scripts/migrate-all.ts       # Custom migrations only
tsx scripts/migrate-fts5.ts      # FTS5 only
```

### Method 2: One-Line Migration Command

Run migrations from outside the container:

```bash
docker exec -it gist pnpm run db:migrate:all
```

### Method 3: Temporary Container for Migrations

Run migrations using a temporary container with the volume mounted:

```bash
# Run migration using your image
docker run --rm \
  -v gist_data:/app/data \
  mewthedev/gist:latest \
  pnpm run db:migrate:all
```

### Method 4: Local Migration with Volume

If you have the codebase locally and want to migrate the Docker volume:

```bash
# First, find the volume path
docker volume inspect gist_data

# Copy database locally (optional backup)
docker cp gist:/app/data/sqlite.db ./backup.db

# Run migrations locally
pnpm run db:migrate:all

# Copy back (if you migrated locally)
docker cp ./data/sqlite.db gist:/app/data/sqlite.db
```

---

## Migration Scripts

### Available Commands

```bash
# Generate new migrations
pnpm run db:generate           # Generate with FTS5 support
pnpm run db:generate:base      # Generate without FTS5

# Run migrations
pnpm run db:migrate:all        # Run ALL migrations (recommended)
pnpm run db:migrate            # Run Drizzle schema migrations only
pnpm run db:migrate:fts5       # Run FTS5 migration only

# Database tools
pnpm run db:studio             # Open Drizzle Studio (not in production!)
pnpm run seed                  # Seed database with test data
```

### Migration Script Details

#### 1. `scripts/migrate-all.ts` (Comprehensive)

Runs ALL migrations in the correct order:
- ✅ Drizzle schema migrations
- ✅ FTS5 full-text search
- ✅ Subscriptions & notifications tables
- ✅ User followed notification type
- ✅ Idempotent (safe to run multiple times)
- ✅ Automatic verification

**When to use:** Always use this for production deployments.

#### 2. `scripts/migrate-fts5.ts`

Only adds FTS5 full-text search:
```bash
docker exec -it gist tsx scripts/migrate-fts5.ts
```

#### 3. `scripts/migrate-subscriptions-notifications.ts`

Only adds subscriptions and notifications:
```bash
docker exec -it gist tsx scripts/migrate-subscriptions-notifications.ts
```

#### 4. `scripts/migrate-user-followed-notification.ts`

Only adds user_followed notification type:
```bash
docker exec -it gist tsx scripts/migrate-user-followed-notification.ts
```

---

## Best Practices

### 1. Always Use Volumes for Database

```yaml
# docker-compose.yml
volumes:
  - gist_data:/app/data  # ✅ Persists across updates
```

Never store the database in the container filesystem! You'll lose data on updates.

### 2. Backup Before Major Updates

```bash
# Create backup
docker exec gist sh -c 'cd /app/data && sqlite3 sqlite.db ".backup backup-$(date +%Y%m%d-%H%M%S).db"'

# Or copy out
docker cp gist:/app/data/sqlite.db ./backup-$(date +%Y%m%d-%H%M%S).db

# List backups in container
docker exec gist ls -lh /app/data/
```

### 3. Check Migration Status

Verify migrations ran successfully:

```bash
# Check container logs
docker-compose logs gist | grep -A 20 "Running database migrations"

# Verify tables exist
docker exec -it gist sh -c 'cd /app/data && sqlite3 sqlite.db "SELECT name FROM sqlite_master WHERE type=\"table\" ORDER BY name;"'

# Check FTS5 table
docker exec -it gist sh -c 'cd /app/data && sqlite3 sqlite.db "SELECT COUNT(*) FROM gists_fts;"'
```

### 4. Zero-Downtime Deployments

For production with minimal downtime:

```bash
# 1. Pull new image first
docker-compose pull

# 2. Quick restart (migrations run automatically)
docker-compose up -d

# 3. Monitor startup
docker-compose logs -f gist
```

The startup migrations usually complete in < 5 seconds for existing databases.

### 5. Test Migrations Locally First

Before deploying to production:

```bash
# 1. Copy production database (sanitize if needed)
docker cp production-gist:/app/data/sqlite.db ./test-prod.db

# 2. Test migration locally
DATABASE_URL=./test-prod.db pnpm run db:migrate:all

# 3. Verify results
DATABASE_URL=./test-prod.db pnpm run db:studio
```

---

## Troubleshooting

### Issue: Container Fails to Start After Update

**Symptom:** Container exits immediately after `docker-compose up -d`

**Solution:**
```bash
# Check logs for migration errors
docker-compose logs gist

# Common causes:
# 1. Migration failed - check error message
# 2. Permission issues with volume
# 3. Corrupted database
```

If migrations failed:
```bash
# Restore from backup
docker cp ./backup.db gist:/app/data/sqlite.db

# Try again
docker-compose restart gist
```

### Issue: "Database is Locked"

**Symptom:** `database is locked` error during migration

**Cause:** Another process is using the database

**Solution:**
```bash
# Stop all containers
docker-compose down

# Start fresh
docker-compose up -d

# If persistent, check for zombie processes
docker exec -it gist sh -c 'lsof /app/data/sqlite.db 2>/dev/null || fuser /app/data/sqlite.db 2>/dev/null'
```

### Issue: "Table Already Exists"

**Symptom:** Migration fails with "table already exists"

**Cause:** Migrations might have partially run

**Solution:**
The `migrate-all.ts` script is designed to be idempotent. If you see this error with custom scripts:

```bash
# Run the comprehensive migration instead
docker exec -it gist pnpm run db:migrate:all
```

### Issue: Missing Volume Data After Update

**Symptom:** Database is empty after updating

**Cause:** Volume wasn't properly configured or was deleted

**Solution:**
```bash
# Check if volume exists
docker volume ls | grep gist_data

# Check volume mount
docker inspect gist | grep -A 10 Mounts

# Verify volume path in docker-compose.yml
cat docker-compose.yml | grep -A 2 volumes
```

Always ensure the volume is defined in `docker-compose.yml`:
```yaml
volumes:
  - gist_data:/app/data  # Required!
```

### Issue: Migrations Take Too Long

**Symptom:** Container startup takes > 30 seconds

**Cause:** Large database or FTS5 re-indexing

**Solution:**
```bash
# Check database size
docker exec gist du -h /app/data/sqlite.db

# Check FTS5 index size
docker exec -it gist sh -c 'cd /app/data && sqlite3 sqlite.db "SELECT COUNT(*) FROM gists_fts;"'

# If very large, consider:
# 1. Increase healthcheck start_period in docker-compose.yml
# 2. Optimize FTS5 (PRAGMA optimize)
```

### Issue: Need to Roll Back a Migration

**Symptom:** New migration broke something

**Solution:**
```bash
# 1. Stop the container
docker-compose down

# 2. Restore database from backup
docker run --rm -v gist_data:/app/data -v $(pwd):/backup alpine \
  cp /backup/backup.db /app/data/sqlite.db

# 3. Roll back to previous image version
docker-compose pull mewthedev/gist:previous-tag
docker-compose up -d
```

---

## Advanced: Custom Migration Strategy

If you want more control, you can disable automatic migrations:

### 1. Create a Custom Init Script

```dockerfile
# In Dockerfile, modify the init script:
RUN echo '#!/bin/sh' > /app/init.sh && \
  echo 'if [ "$RUN_MIGRATIONS" = "true" ]; then' >> /app/init.sh && \
  echo '  echo "Running migrations..."' >> /app/init.sh && \
  echo '  pnpm run db:migrate:all' >> /app/init.sh && \
  echo 'else' >> /app/init.sh && \
  echo '  echo "Skipping migrations (RUN_MIGRATIONS != true)"' >> /app/init.sh && \
  echo 'fi' >> /app/init.sh && \
  echo 'exec pnpm start' >> /app/init.sh && \
  chmod +x /app/init.sh
```

### 2. Control Via Environment Variable

```yaml
# docker-compose.yml
environment:
  - RUN_MIGRATIONS=false  # Disable automatic migrations
```

### 3. Run Migrations Manually

```bash
# Run migrations before starting app
docker-compose run --rm gist pnpm run db:migrate:all

# Then start normally
docker-compose up -d
```

---

## Summary

**For most deployments:**
1. Just run `docker-compose up -d` - migrations happen automatically ✅
2. Monitor logs: `docker-compose logs -f gist`
3. Backup before major updates: `docker cp gist:/app/data/sqlite.db ./backup.db`

**For troubleshooting:**
1. Check logs: `docker-compose logs gist`
2. Run manually: `docker exec -it gist pnpm run db:migrate:all`
3. Restore from backup if needed

**Key Points:**
- ✅ Migrations are automatic on container startup
- ✅ Safe to run multiple times (idempotent)
- ✅ Database persists in Docker volume
- ✅ Use `pnpm run db:migrate:all` for comprehensive migrations
- ✅ Always backup before major updates

---

## Quick Reference

```bash
# Deploy new version (automatic migrations)
docker-compose pull && docker-compose up -d

# Check migration logs
docker-compose logs -f gist

# Manual migration
docker exec -it gist pnpm run db:migrate:all

# Backup database
docker cp gist:/app/data/sqlite.db ./backup-$(date +%Y%m%d).db

# Restore database
docker cp ./backup.db gist:/app/data/sqlite.db
docker-compose restart gist

# Verify tables
docker exec -it gist sh -c 'cd /app/data && sqlite3 sqlite.db ".tables"'

# Check database size
docker exec gist du -h /app/data/sqlite.db
```

