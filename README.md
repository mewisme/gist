# Gist - Gist-like Code Sharing Platform

A modern, full-featured code sharing platform built with Next.js 16, Drizzle ORM, and JWT-based authentication. Share code snippets with syntax highlighting, versioning, and collaboration features.

## Features

- [AUTH] **Secure Authentication** - JWT-based authentication with bcrypt password hashing
- [CODE] **Multi-file Gists** - Create gists with multiple files and languages
- [UI] **Syntax Highlighting** - Beautiful code highlighting with Shiki
- [SOCIAL] **Social Features** - Star, fork, and comment on gists
- [NOTIFY] **Subscriptions & Notifications** - Subscribe to users or gists and get real-time notifications
- [SEARCH] **FTS5 Full-Text Search** - Fast, indexed search with SQLite FTS5 extension
- [MOBILE] **Responsive Design** - Works perfectly on desktop and mobile
- [DOCKER] **Docker Ready** - Easy deployment with Docker and docker-compose
- [THEME] **Dark Mode** - Beautiful dark and light themes
- [CACHE] **Cache Management** - Intelligent caching for better performance

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript, RSC + Server Actions)
- **Package Manager**: pnpm
- **UI**: TailwindCSS + shadcn/ui with animate-ui
- **Authentication**: JWT tokens with bcrypt password hashing
- **Database**: SQLite with Drizzle ORM
- **Editor**: Monaco Editor for editing, Shiki for read views
- **Deployment**: Docker with multi-stage builds
- **State Management**: Zustand for client-side state

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) installed
- [pnpm](https://pnpm.io) installed
- Docker (optional, for containerized deployment)

### 1. Clone and Install

```bash
git clone <repository-url>
cd gist
pnpm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# JWT Secret for token signing (use a strong random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Optional: Database URL (defaults to ./data/sqlite.db)
DATABASE_URL=./data/sqlite.db
```

Generate a secure JWT secret:

```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Database Setup

The SQLite database will be created automatically in the `./data/` directory. Generate and run migrations:

```bash
pnpm run db:generate      # Generate migrations from schema (includes FTS5 automatically)
pnpm run db:migrate:all   # Apply all migrations (schema + custom migrations)
```

**Note:** `db:migrate:all` runs all migrations including:
- Drizzle schema migrations
- FTS5 full-text search
- Subscriptions & notifications
- All other custom migrations

For Docker deployments, migrations run automatically on container startup. See [Migration Guide](docs/MIGRATION_QUICK_START.md).

Seed the database with demo data:

```bash
pnpm run seed
```

Optional: Open Drizzle Studio to browse the database:

```bash
pnpm run db:studio
```

### 4. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Database Schema

The application uses SQLite with the following main tables:

- **users** - User profiles with authentication info
- **user_passwords** - Hashed passwords with salt
- **user_sessions** - Active JWT sessions
- **password_reset_tokens** - Password reset flow
- **gists** - Code snippets with metadata
- **files** - Individual files within gists
- **revisions** - Version history for gists
- **revision_files** - File snapshots for each revision
- **comments** - Comments on gists
- **stars** - User stars for gists
- **subscriptions** - User and gist subscriptions
- **notifications** - User notifications for subscribed activities
- **gists_fts** - FTS5 virtual table for full-text search

## API Routes

### Authentication

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Sign in with email/password
- `POST /api/auth/signout` - Sign out current session
- `POST /api/auth/verify` - Verify JWT token

### Gists

- `GET /api/gists/[gistId]` - Get gist details
- `POST /api/gists/[gistId]/fork` - Fork a gist
- `POST /api/gists/[gistId]/star` - Star/unstar a gist
- `GET /api/search?q=...` - Search public gists

### Comments

- `GET /api/comments?gistId=...` - Get comments for a gist
- `POST /api/comments` - Create a comment
- `DELETE /api/comments/[commentId]` - Delete a comment

### Subscriptions

- `POST /api/subscriptions/users/[userId]` - Subscribe to a user
- `DELETE /api/subscriptions/users/[userId]` - Unsubscribe from a user
- `GET /api/subscriptions/users/[userId]` - Check user subscription status
- `POST /api/subscriptions/gists/[gistId]` - Subscribe to a gist
- `DELETE /api/subscriptions/gists/[gistId]` - Unsubscribe from a gist
- `GET /api/subscriptions/gists/[gistId]` - Check gist subscription status
- `GET /api/subscriptions/me` - Get subscription counts (following, followers, gists)

### Notifications

- `GET /api/notifications` - Get user notifications (supports pagination and filtering)
- `PATCH /api/notifications` - Mark all notifications as read
- `DELETE /api/notifications` - Delete all notifications
- `GET /api/notifications/unread-count` - Get unread notification count
- `PATCH /api/notifications/[notificationId]` - Mark notification as read
- `DELETE /api/notifications/[notificationId]` - Delete notification

### User

- `GET /api/user/settings` - Get user settings
- `POST /api/user/settings` - Update user settings

### Other

- `GET /r/[gistId]/[fileId]` - Raw file content

## Pages & Routes

- `/` - Create new gist (Monaco editor) - redirects to `/discover` if not authenticated
- `/discover` - Discover and browse public gists
- `/r/[gistId]/[fileId]` - Raw file content
- `/g/[gistId]` - View gist with syntax highlighting
- `/g/[gistId]/edit` - Edit gist (requires authentication)
- `/u/[handle]` - User profile page with their gists
- `/notifications` - View and manage notifications (requires authentication)
- `/settings` - User settings (requires authentication)
- `/signin` - Sign in page

## Docker Deployment

### Quick Start with Docker

1. **Set environment variables** (create `.env` or export):

```bash
export JWT_SECRET=$(openssl rand -base64 32)
export DATABASE_URL=./data/sqlite.db
```

2. **Build and run**:

```bash
docker-compose build
docker-compose up -d
```

3. **View logs**:

```bash
docker-compose logs -f
```

The application will be available at `http://localhost:3000`.

**[AUTO] Automatic Migrations:** Database migrations run automatically on container startup. No manual intervention needed for updates! See [Migration Quick Start](docs/MIGRATION_QUICK_START.md) for details.

### Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Rebuild and start
docker-compose up -d --build
```

### Environment Variables

Set in your shell or create a `.env` file:

```bash
JWT_SECRET=your-super-secret-jwt-key-here
DATABASE_URL=./data/sqlite.db
NODE_ENV=production
```

### Data Persistence

The database is stored in a Docker named volume (`gist_data`) that persists across container restarts.

**Backup database:**
```bash
docker run --rm -v gist_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/backup.tar.gz -C /data .
```

**Restore database:**
```bash
docker run --rm -v gist_data:/data -v $(pwd):/backup alpine \
  tar xzf /backup/backup.tar.gz -C /data
```

📖 **For detailed Docker documentation, see [DOCKER.md](./DOCKER.md)**

## Development Scripts

```bash
# Development
pnpm dev                 # Start development server
pnpm build              # Build for production
pnpm start              # Start production server

# Database
pnpm run db:generate    # Generate migrations from schema
pnpm run db:migrate:all # Apply all migrations (recommended)
pnpm run db:migrate     # Apply Drizzle schema migrations only
pnpm run db:studio      # Open Drizzle Studio
pnpm run seed           # Seed database with demo data

# Code Quality
pnpm run lint           # Run ESLint
pnpm run format         # Format code with Prettier
pnpm run format:check   # Check formatting
```

## Project Structure

```
src/
├── app/                           # Next.js App Router
│   ├── (no-nav)/                 # Layout without navigation
│   │   └── e/[gistId]/           # Embed gist page
│   ├── (with-nav)/               # Layout with navigation
│   │   ├── discover/             # Discover public gists
│   │   ├── g/                    # Gist pages
│   │   │   ├── [gistId]/         # View/edit gist
│   │   │   │   ├── download/      # Download gist files
│   │   │   │   ├── edit/         # Edit gist page
│   │   │   │   └── revisions/    # Revision history
│   │   │   └── new/              # Create new gist
│   │   ├── notifications/        # Notifications page
│   │   ├── settings/             # User settings
│   │   ├── signin/               # Sign in page
│   │   ├── signup/               # Sign up page
│   │   ├── u/[handle]/           # User profile page
│   │   └── page.tsx              # Home page
│   ├── actions/                  # Server Actions
│   │   └── gist-actions.ts       # Gist-related actions
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── signin/           # Sign in API
│   │   │   ├── signout/          # Sign out API
│   │   │   ├── signup/           # Sign up API
│   │   │   └── verify/           # Token verification
│   │   ├── comments/             # Comment CRUD
│   │   │   └── [commentId]/      # Individual comment operations
│   │   ├── gists/                # Gist CRUD, fork, star
│   │   │   └── [gistId]/         # Individual gist operations
│   │   │       ├── download/     # Download gist files
│   │   │       ├── fork/         # Fork gist
│   │   │       ├── revisions/    # Revision management
│   │   │       └── star/         # Star/unstar gist
│   │   ├── search/               # Search functionality
│   │   ├── user/settings/        # User settings API
│   │   └── r/[gistId]/[fileId]/  # Raw file content
│   ├── layout.tsx                # Root layout
│   ├── not-found.tsx             # 404 page
│   ├── robots.ts                 # SEO robots.txt
│   └── sitemap.ts                # SEO sitemap
├── components/                   # React components
│   ├── animate-ui/               # Animate UI components
│   │   ├── components/           # Animate UI components
│   │   └── primitives/          # Animate UI primitives
│   ├── auth/                     # Authentication components
│   │   ├── auth-button.tsx       # Auth button component
│   │   ├── auth-context.tsx      # Auth context provider
│   │   ├── auth-provider-wrapper.tsx # Auth wrapper
│   │   ├── signin-page-client.tsx    # Sign in page client
│   │   └── signup-page-client.tsx    # Sign up page client
│   ├── common/                   # Common components
│   │   ├── footer.tsx           # Footer component
│   │   └── navigation.tsx       # Navigation component
│   ├── discover/                 # Discover page components
│   │   └── sort-dropdown.tsx    # Sort dropdown
│   ├── editor/                   # Code editor components
│   │   └── code-editor.tsx      # Monaco editor wrapper
│   ├── gist/                     # Gist-related components
│   │   ├── client-code-block.tsx # Client-side code block
│   │   ├── comment-form.tsx     # Comment form
│   │   ├── comment-list.tsx     # Comment list
│   │   ├── edit-gist-page-client.tsx # Edit gist page
│   │   ├── embed-gist-client.tsx # Embed gist component
│   │   ├── fork-button.tsx      # Fork button
│   │   ├── gist-actions-dropdown.tsx # Gist actions menu
│   │   ├── gist-card.tsx        # Gist card component
│   │   ├── gist-page-client.tsx # Gist page client
│   │   ├── gist-revision-page-client.tsx # Revision page
│   │   ├── new-gist-page-client.tsx # New gist page
│   │   ├── revision-history.tsx # Revision history
│   │   ├── star-button.tsx      # Star button
│   │   ├── subscribe-to-gist-button.tsx # Subscribe to gist
│   │   └── subscribe-to-user-button.tsx # Subscribe to user
│   ├── notifications/            # Notification components
│   │   └── notification-button.tsx # Notification bell button
│   ├── providers/                 # Context providers
│   │   └── theme-provider.tsx   # Theme provider
│   ├── screens/                  # Screen components
│   │   ├── home-page-client.tsx # Home page client
│   │   └── not-found-page-client.tsx # 404 page client
│   ├── settings/                 # Settings components
│   │   └── settings-page-client.tsx # Settings page
│   ├── theme/                    # Theme management
│   │   ├── theme-provider.tsx   # Theme provider
│   │   └── theme-toggle.tsx     # Theme toggle
│   ├── ui/                       # shadcn/ui components
│   │   ├── shadcn-io/           # Additional shadcn components
│   │   └── [various UI components] # All shadcn/ui components
│   └── user/                     # User-related components
│       └── user-sort-dropdown.tsx # User sort dropdown
├── hooks/                        # React hooks
│   ├── use-controlled-state.tsx # Controlled state hook
│   ├── use-data-state.tsx       # Data state hook
│   ├── use-is-in-view.tsx       # Intersection observer hook
│   └── use-mobile.ts            # Mobile detection hook
├── lib/                          # Utilities and configurations
│   ├── auth.ts                  # Authentication utilities
│   ├── auth-utils.ts            # Auth helper functions
│   ├── avatar.ts                # Avatar utilities
│   ├── db/                      # Database schema and connection
│   │   ├── index.ts             # Database connection
│   │   └── schema.ts            # Drizzle schema definitions
│   ├── get-strict-context.tsx   # Strict context helper
│   ├── gravatar.ts              # Gravatar utilities
│   ├── id-utils.ts              # ID generation utilities
│   ├── repositories/             # Data access layer
│   │   ├── comment-repository.ts # Comment operations
│   │   ├── gist-repository.ts    # Gist operations
│   │   └── star-repository.ts   # Star operations
│   ├── stores/                  # Zustand stores
│   │   └── gist-store.ts        # Gist state management
│   ├── utils/                   # Utility functions
│   │   └── language-detection.ts # Code language detection
│   └── utils.ts                 # General utilities
└── styles/                      # Global styles
    └── globals.css              # Global CSS styles
```

## Key Features

### Authentication Flow

1. User signs up with email and password
2. Password is hashed with bcrypt and stored
3. User signs in and receives a JWT token
4. Token is stored in HTTP-only cookies
5. Protected routes verify the token

### Gist Management

- Create public or private gists
- Multiple files per gist
- Syntax highlighting for 100+ languages
- Revision history tracking
- Fork and star functionality
- Comment system

### Security

- Password hashing with bcrypt
- JWT token-based authentication
- HTTP-only cookies for session management
- Input validation with Zod
- SQL injection protection via Drizzle ORM

## Documentation

- [Migration Quick Start](docs/MIGRATION_QUICK_START.md) - Quick reference for database migrations in Docker
- [Docker Migrations Guide](docs/DOCKER_MIGRATIONS.md) - Comprehensive database migration guide for Docker
- [FTS5 Full-Text Search](docs/FTS5_SEARCH.md) - Full-text search implementation guide
- [Docker Deployment](DOCKER.md) - Docker deployment instructions
- [Subscriptions & Notifications](docs/SUBSCRIPTIONS_NOTIFICATIONS.md) - Subscription and notification system
- [Notification UI](docs/NOTIFICATION_UI_FEATURE.md) - Notification bell icon and page

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database ORM by [Drizzle](https://orm.drizzle.team/)
- Code highlighting by [Shiki](https://shiki.matsu.io/)
- Code editor by [Monaco Editor](https://microsoft.github.io/monaco-editor/)