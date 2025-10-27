# Docker Deployment Guide

This guide will help you deploy Gist using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

### 1. Set Environment Variables

Create a `.env.production` file in the project root:

```bash
# Generate a secure JWT secret
openssl rand -base64 32

# Add to .env.production
JWT_SECRET=your-generated-secret-here
DATABASE_URL=./data/sqlite.db
NODE_ENV=production
```

### 2. Build and Run with Docker Compose

```bash
# Build the image
docker-compose build

# Start the container
docker-compose up -d

# View logs
docker-compose logs -f
```

The application will be available at `http://localhost:3000`.

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret key for JWT token signing | `changeme-in-production` | Yes |
| `DATABASE_URL` | SQLite database path | `./data/sqlite.db` | No |
| `NODE_ENV` | Node environment | `production` | No |

## Docker Commands

### Build the Image

```bash
docker-compose build
```

### Start the Container

```bash
docker-compose up -d
```

### Stop the Container

```bash
docker-compose down
```

### View Logs

```bash
# Follow logs
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100
```

### Restart the Container

```bash
docker-compose restart
```

### Remove Everything (including volumes)

```bash
docker-compose down -v
```

## Data Persistence

The SQLite database is stored in a Docker named volume (`gist_data`). This ensures data persists across container restarts.

To backup the database:

```bash
docker run --rm -v gist_data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz -C /data .
```

To restore from backup:

```bash
docker run --rm -v gist_data:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/backup.tar.gz"
```

## Health Checks

The container includes a health check that verifies the application is responding. Check container health:

```bash
docker-compose ps
```

## Troubleshooting

### Container won't start

1. Check logs: `docker-compose logs`
2. Verify environment variables are set
3. Ensure port 3000 is not in use

### Database migration errors

If migrations fail, you can manually run them:

```bash
docker-compose exec gist pnpm drizzle-kit migrate
```

### Permission errors

If you encounter permission errors with the data directory:

```bash
docker-compose exec gist chown -R nextjs:nodejs /app/data
```

### Rebuild from scratch

To completely rebuild the container:

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Development with Docker

For development, mount your source code:

```bash
docker-compose -f docker-compose.dev.yml up
```

Create a `docker-compose.dev.yml` file:

```yaml
version: "3.8"

services:
  gist:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
      - gist_data:/app/data
    environment:
      - NODE_ENV=development
      - DATABASE_URL=./data/sqlite.db
      - JWT_SECRET=${JWT_SECRET:-dev-secret}
    command: pnpm dev
```

## Production Deployment

### Using Docker Compose

1. Set up your environment variables in `.env.production`
2. Build and start: `docker-compose up -d`
3. Verify health: `docker-compose ps`

### Using Docker Swarm

```bash
docker stack deploy -c docker-compose.yml gist
```

### Using Kubernetes

See `k8s/` directory for Kubernetes manifests (if available).

## Security Considerations

1. **Change Default JWT Secret**: Always use a strong, randomly generated secret
2. **Use HTTPS**: Set up a reverse proxy (nginx/traefik) with SSL certificates
3. **Firewall**: Only expose necessary ports
4. **Regular Updates**: Keep Docker images updated

## Monitoring

Monitor container metrics:

```bash
# View resource usage
docker stats gist

# Check container logs
docker-compose logs -f gist
```

## Backup and Restore

### Backup

```bash
# Backup database volume
docker run --rm -v gist_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/db-backup-$(date +%Y%m%d).tar.gz -C /data .
```

### Restore

```bash
# Restore from backup
docker run --rm -v gist_data:/data -v $(pwd):/backup alpine \
  tar xzf /backup/db-backup-YYYYMMDD.tar.gz -C /data
```

## Support

For issues or questions:
1. Check the logs: `docker-compose logs`
2. Review this documentation
3. Open an issue on GitHub
