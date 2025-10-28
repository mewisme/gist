# Database Migrations - Quick Start Guide

Quick reference for running database migrations in Docker deployments.

## 🚀 TL;DR - Most Common Use Cases

### Deploy New Version (Automatic Migrations)

```bash
# Migrations run automatically on startup!
docker-compose pull
docker-compose up -d
docker-compose logs -f gist  # Watch for "✅ All migrations completed"
```

### Run Migrations Manually

```bash
# If you need to run migrations manually:
docker exec -it gist pnpm run db:migrate:all
```

### Backup Database Before Update

```bash
# Always backup before major updates!
docker cp gist:/app/data/sqlite.db ./backup-$(date +%Y%m%d-%H%M%S).db
```

---

## 📋 Common Commands

| Task | Command |
|------|---------|
| **Deploy & auto-migrate** | `docker-compose up -d` |
| **Manual migration** | `docker exec -it gist pnpm run db:migrate:all` |
| **Check logs** | `docker-compose logs -f gist` |
| **Backup DB** | `docker cp gist:/app/data/sqlite.db ./backup.db` |
| **Restore DB** | `docker cp ./backup.db gist:/app/data/sqlite.db` |
| **Restart container** | `docker-compose restart gist` |
| **Verify tables** | `docker exec -it gist sh -c 'cd /app/data && sqlite3 sqlite.db ".tables"'` |
| **Check DB size** | `docker exec gist du -h /app/data/sqlite.db` |

---

## 🔄 Migration Types

Your app has **4 migration types** that run automatically:

1. **Drizzle Schema** - Core database schema
2. **FTS5 Search** - Full-text search functionality
3. **Subscriptions** - User/gist subscriptions
4. **Notifications** - Notification system

All handled by: `pnpm run db:migrate:all`

---

## ⚡ Quick Troubleshooting

### Container won't start after update

```bash
# Check logs for errors
docker-compose logs gist

# Restore from backup
docker cp ./backup.db gist:/app/data/sqlite.db
docker-compose restart gist
```

### "Database is locked" error

```bash
# Stop and restart
docker-compose down
docker-compose up -d
```

### Migrations seem stuck

```bash
# Check if it's running
docker exec gist ps aux | grep migrate

# Force restart
docker-compose restart gist
```

---

## 🎯 Best Practices

1. ✅ **Always backup before major updates**
   ```bash
   docker cp gist:/app/data/sqlite.db ./backup-$(date +%Y%m%d).db
   ```

2. ✅ **Monitor deployment logs**
   ```bash
   docker-compose logs -f gist
   ```

3. ✅ **Test locally first**
   ```bash
   # Copy prod DB and test migration locally
   DATABASE_URL=./test.db pnpm run db:migrate:all
   ```

4. ✅ **Verify after deployment**
   ```bash
   # Check app is running
   curl http://localhost:7209/
   
   # Check database tables
   docker exec -it gist sh -c 'cd /app/data && sqlite3 sqlite.db ".tables"'
   ```

---

## 📦 Update Workflow Example

Complete workflow for deploying a new version:

```bash
# 1. Backup current database
docker cp gist:/app/data/sqlite.db ./backup-$(date +%Y%m%d-%H%M%S).db

# 2. Pull latest image
docker-compose pull

# 3. Update and restart (migrations run automatically)
docker-compose up -d

# 4. Monitor startup and migrations
docker-compose logs -f gist

# 5. Verify deployment
curl http://localhost:7209/
```

**Expected output in logs:**
```
🚀 Running database migrations...
📦 Step 1: Drizzle schema migrations
   ✓ Schema migrations completed
📦 Step 2: FTS5 Full-Text Search Migration
   ⏭️  FTS5 table already exists - skipping
...
✅ All migrations completed successfully!
🚀 Starting application...
```

---

## 🆘 Emergency Rollback

If something goes wrong:

```bash
# 1. Stop container
docker-compose down

# 2. Restore backup
docker cp ./backup.db gist:/app/data/sqlite.db

# 3. Roll back to previous image
docker-compose pull mewthedev/gist:previous-version
docker-compose up -d

# 4. Verify
docker-compose logs -f gist
curl http://localhost:7209/
```

---

## 📖 More Details

For comprehensive documentation, see: [DOCKER_MIGRATIONS.md](./DOCKER_MIGRATIONS.md)

---

## 💡 Remember

- Migrations run **automatically** on container startup
- Migrations are **idempotent** (safe to run multiple times)
- Database persists in **Docker volume** (`gist_data`)
- **Always backup** before major updates
- Check **logs** if something seems wrong

