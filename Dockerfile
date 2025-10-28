# Multi-stage build for Next.js app with Node 20 and pnpm
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++ libc6-compat

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./
# Install all dependencies including devDependencies for build
# --ignore-scripts=false ensures postinstall script runs
RUN pnpm install --frozen-lockfile --include-workspace-root

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ libc6-compat

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy all files and node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Rebuild better-sqlite3 for Alpine Linux
RUN pnpm rebuild better-sqlite3

# Create data directory for build-time database operations
RUN mkdir -p /app/data

# Generate database migrations
RUN pnpm run db:generate

# Create a temporary database for build-time operations
RUN pnpm drizzle-kit migrate --config=drizzle.config.ts

# Build the app with database available
RUN pnpm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Install pnpm for production
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Copy all node_modules (including devDependencies) for reactCompiler
COPY --from=builder /app/node_modules ./node_modules

# Create data directory for SQLite with proper permissions
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Copy migration scripts
COPY --from=builder /app/scripts ./scripts

# Create init script with comprehensive migrations
RUN echo '#!/bin/sh' > /app/init.sh && \
  echo 'echo ">> Running database migrations..."' >> /app/init.sh && \
  echo 'pnpm run db:migrate:all' >> /app/init.sh && \
  echo 'echo "[SUCCESS] Migrations complete!"' >> /app/init.sh && \
  echo 'echo ">> Starting application..."' >> /app/init.sh && \
  echo 'exec pnpm start' >> /app/init.sh && \
  chmod +x /app/init.sh && \
  chown nextjs:nodejs /app/init.sh

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check script
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Run migrations and start the app
CMD ["/app/init.sh"]
