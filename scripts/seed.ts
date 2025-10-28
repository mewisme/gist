import { eq } from 'drizzle-orm';

import { hashPassword } from '../src/lib/auth-utils';
import { db } from '../src/lib/db';
import { comments, files, gists, stars, userPasswords, users } from '../src/lib/db/schema';
import { getGravatarUrl } from '../src/lib/gravatar';
import { generateId } from '../src/lib/id-utils';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    const demoUsers = [
      {
        id: generateId(),
        email: 'alice.dev@gmail.com',
        handle: 'alice_dev',
        displayName: 'Alice Developer',
        photoUrl: getGravatarUrl('alice.dev@gmail.com'),
        emailVerified: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: generateId(),
        email: 'bob.coder@gmail.com',
        handle: 'bob_coder',
        displayName: 'Bob Coder',
        photoUrl: getGravatarUrl('bob.coder@gmail.com'),
        emailVerified: true,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
      {
        id: generateId(),
        email: 'charlie.js@gmail.com',
        handle: 'charlie_js',
        displayName: 'Charlie JavaScript',
        photoUrl: getGravatarUrl('charlie.js@gmail.com'),
        emailVerified: true,
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
      },
    ];

    const demoPasswords = [
      {
        userId: demoUsers[0].id,
        passwordHash: await hashPassword('password123'),
        salt: '',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        userId: demoUsers[1].id,
        passwordHash: await hashPassword('password123'),
        salt: '',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
      {
        userId: demoUsers[2].id,
        passwordHash: await hashPassword('password123'),
        salt: '',
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
      },
    ];

    const insertedUsers = await db.insert(users).values(demoUsers).returning();
    db.insert(userPasswords).values(demoPasswords).run();

    console.log('✅ Created demo users with passwords');

    const demoGists = [
      {
        id: generateId(),
        ownerId: insertedUsers[0].id,
        description: 'React Hook for API calls with loading states',
        visibility: 'public' as const,
        tags: ['react', 'hooks', 'api'],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        fileCount: 2,
        starCount: 0,
        forkCount: 0,
      },
      {
        id: generateId(),
        ownerId: insertedUsers[1].id,
        description: 'TypeScript utility types collection',
        visibility: 'public' as const,
        tags: ['typescript', 'utilities', 'types'],
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16'),
        fileCount: 1,
        starCount: 0,
        forkCount: 0,
      },
      {
        id: generateId(),
        ownerId: insertedUsers[2].id,
        description: 'Node.js Express middleware for rate limiting',
        visibility: 'public' as const,
        tags: ['nodejs', 'express', 'middleware', 'security'],
        createdAt: new Date('2024-01-17'),
        updatedAt: new Date('2024-01-17'),
        fileCount: 3,
        starCount: 0,
        forkCount: 0,
      },
    ];

    db.insert(gists).values(demoGists).run();
    console.log('✅ Created demo gists');

    const demoFiles = [
      {
        id: generateId(),
        gistId: demoGists[0].id,
        filename: 'useApi.ts',
        language: 'typescript',
        content: `import { useState, useEffect } from 'react';

interface UseApiOptions {
  immediate?: boolean;
}

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(
  url: string,
  options: UseApiOptions = {}
): UseApiState<T> & { refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (options.immediate !== false) {
      fetchData();
    }
  }, [url, options.immediate]);

  return { data, loading, error, refetch: fetchData };
}`,
        size: 1234,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: generateId(),
        gistId: demoGists[0].id,
        filename: 'useApi.example.tsx',
        language: 'typescript',
        content: `import React from 'react';
import { useApi } from './useApi';

interface User {
  id: number;
  name: string;
  email: string;
}

export function UserProfile({ userId }: { userId: number }) {
  const { data: user, loading, error, refetch } = useApi<User>(
    \`/api/users/\${userId}\`
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}`,
        size: 567,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },

      {
        id: generateId(),
        gistId: demoGists[1].id,
        filename: 'utility-types.ts',
        language: 'typescript',
        content: `export type Partial<T> = {
  [P in keyof T]?: T[P];
};

export type Required<T> = {
  [P in keyof T]-?: T[P];
};

export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

export type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

export type Extract<T, U> = T extends U ? T : never;

export type Exclude<T, U> = T extends U ? never : T;

export type NonNullable<T> = T extends null | undefined ? never : T;

export type ReturnType<T extends (...args: any) => any> = 
  T extends (...args: any) => infer R ? R : any;

export type Parameters<T extends (...args: any) => any> = 
  T extends (...args: infer P) => any ? P : never;

export type ConstructorParameters<T extends new (...args: any) => any> = 
  T extends new (...args: infer P) => any ? P : never;

export type InstanceType<T extends new (...args: any) => any> = 
  T extends new (...args: any) => infer R ? R : any;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};`,
        size: 1890,
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16'),
      },

      {
        id: generateId(),
        gistId: demoGists[2].id,
        filename: 'rateLimiter.js',
        language: 'javascript',
        content: `const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('redis');

const redisClient = Redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:',
    }),
    ...options,
  };

  return rateLimit(defaultOptions);
};

const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
});

const apiLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 60,
});

module.exports = {
  generalLimiter,
  authLimiter,
  apiLimiter,
  createRateLimiter,
};`,
        size: 1456,
        createdAt: new Date('2024-01-17'),
        updatedAt: new Date('2024-01-17'),
      },
      {
        id: generateId(),
        gistId: demoGists[2].id,
        filename: 'app.js',
        language: 'javascript',
        content: `const express = require('express');
const { generalLimiter, authLimiter, apiLimiter } = require('./rateLimiter');

const app = express();

app.use(generalLimiter);

app.use('/auth', authLimiter);

app.use('/api', apiLimiter);

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.post('/auth/login', (req, res) => {
  res.json({ message: 'Login successful' });
});

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});`,
        size: 678,
        createdAt: new Date('2024-01-17'),
        updatedAt: new Date('2024-01-17'),
      },
      {
        id: generateId(),
        gistId: demoGists[2].id,
        filename: 'README.md',
        language: 'markdown',
        content: `# Express Rate Limiting Middleware

A comprehensive rate limiting solution for Express.js applications using Redis for distributed rate limiting.

## Features

- Redis-backed distributed rate limiting
- Different rate limits for different route groups
- Configurable time windows and request limits
- Standard and legacy headers support
- Custom error messages

## Installation

\`\`\`bash
npm install express-rate-limit rate-limit-redis redis
\`\`\`

## Usage

\`\`\`javascript
const { generalLimiter, authLimiter, apiLimiter } = require('./rateLimiter');

app.use(generalLimiter);

app.use('/auth', authLimiter);
app.use('/api', apiLimiter);
\`\`\`

## Configuration

Set the following environment variables:

- \`REDIS_HOST\`: Redis server host (default: localhost)
- \`REDIS_PORT\`: Redis server port (default: 6379)

## Rate Limits

- **General**: 100 requests per 15 minutes
- **Auth**: 5 requests per 15 minutes
- **API**: 60 requests per minute`,
        size: 1234,
        createdAt: new Date('2024-01-17'),
        updatedAt: new Date('2024-01-17'),
      },
    ];

    db.insert(files).values(demoFiles).run();
    console.log('✅ Created demo files');

    const demoComments = [
      {
        id: generateId(),
        gistId: demoGists[0].id,
        authorId: insertedUsers[1].id,
        text: 'Great hook! I love how you handle the loading states. This will be very useful for my projects.',
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16'),
      },
      {
        id: generateId(),
        gistId: demoGists[0].id,
        authorId: insertedUsers[2].id,
        text: 'Nice implementation! Have you considered adding retry logic for failed requests?',
        createdAt: new Date('2024-01-17'),
        updatedAt: new Date('2024-01-17'),
      },
      {
        id: generateId(),
        gistId: demoGists[1].id,
        authorId: insertedUsers[0].id,
        text: 'Excellent collection of utility types! The DeepPartial and DeepReadonly types are particularly useful.',
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-18'),
      },
    ];

    db.insert(comments).values(demoComments).run();
    console.log('✅ Created demo comments');

    const demoStars = [
      { userId: insertedUsers[1].id, gistId: demoGists[0].id },
      { userId: insertedUsers[2].id, gistId: demoGists[0].id },
      { userId: insertedUsers[0].id, gistId: demoGists[1].id },
      { userId: insertedUsers[2].id, gistId: demoGists[1].id },
      { userId: insertedUsers[0].id, gistId: demoGists[2].id },
      { userId: insertedUsers[1].id, gistId: demoGists[2].id },
    ];

    db.insert(stars).values(demoStars).run();
    console.log('✅ Created demo stars');

    await db
      .update(gists)
      .set({ starCount: 2 })
      .where(eq(gists.id, demoGists[0].id));

    await db
      .update(gists)
      .set({ starCount: 2 })
      .where(eq(gists.id, demoGists[1].id));

    await db
      .update(gists)
      .set({ starCount: 2 })
      .where(eq(gists.id, demoGists[2].id));

    console.log('✅ Updated star counts');

    console.log('🎉 Database seeded successfully!');
    console.log('\\nDemo data created:');
    console.log('- 3 users (alice_dev, bob_coder, charlie_js)');
    console.log('- 3 public gists with multiple files');
    console.log('- Comments and stars');
    console.log('\\nYou can now start the development server with: pnpm dev');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
