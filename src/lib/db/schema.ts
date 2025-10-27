import { relations, sql } from 'drizzle-orm';
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  unique,
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    handle: text('handle').notNull().unique(),
    displayName: text('display_name').notNull(),
    photoUrl: text('photo_url'),
    emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(true),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    handleIdx: index('users_handle_idx').on(table.handle),
    emailIdx: index('users_email_idx').on(table.email),
  })
);

export const userPasswords = sqliteTable(
  'user_passwords',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' })
      .primaryKey(),
    passwordHash: text('password_hash').notNull(),
    salt: text('salt').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  }
);

export const userSessions = sqliteTable(
  'user_sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    userIdIdx: index('user_sessions_user_id_idx').on(table.userId),
    tokenIdx: index('user_sessions_token_idx').on(table.token),
    expiresIdx: index('user_sessions_expires_idx').on(table.expiresAt),
  })
);

export const passwordResetTokens = sqliteTable(
  'password_reset_tokens',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    userIdIdx: index('password_reset_tokens_user_id_idx').on(table.userId),
    tokenIdx: index('password_reset_tokens_token_idx').on(table.token),
    expiresIdx: index('password_reset_tokens_expires_idx').on(table.expiresAt),
  })
);

export const gists = sqliteTable(
  'gists',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title'),
    description: text('description'),
    visibility: text('visibility', { enum: ['public', 'secret'] })
      .notNull()
      .default('public'),
    tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    fileCount: integer('file_count').notNull().default(0),
    starCount: integer('star_count').notNull().default(0),
    forkCount: integer('fork_count').notNull().default(0),
    forkId: text('fork_id'),
  },
  (table) => ({
    visibilityCreatedIdx: index('gists_visibility_created_idx').on(
      table.visibility,
      table.createdAt
    ),
    ownerCreatedIdx: index('gists_owner_created_idx').on(
      table.ownerId,
      table.createdAt
    ),
    forkIdx: index('gists_fork_idx').on(table.forkId),
  })
);

export const files = sqliteTable(
  'files',
  {
    id: text('id').primaryKey(),
    gistId: text('gist_id')
      .notNull()
      .references(() => gists.id, { onDelete: 'cascade' }),
    filename: text('filename').notNull(),
    language: text('language').notNull(),
    content: text('content').notNull(),
    size: integer('size').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    gistIdx: index('files_gist_idx').on(table.gistId),
    gistFilenameIdx: unique('files_gist_filename_idx').on(
      table.gistId,
      table.filename
    ),
  })
);

export const revisions = sqliteTable(
  'revisions',
  {
    id: text('id').primaryKey(),
    gistId: text('gist_id')
      .notNull()
      .references(() => gists.id, { onDelete: 'cascade' }),
    parentRevId: text('parent_rev_id'),
    snapshotMeta: text('snapshot_meta', { mode: 'json' })
      .$type<{
        description?: string;
        tags?: string[];
        fileCount: number;
      }>()
      .notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    gistIdx: index('revisions_gist_idx').on(table.gistId),
    parentIdx: index('revisions_parent_idx').on(table.parentRevId),
  })
);

export const revisionFiles = sqliteTable(
  'revision_files',
  {
    id: text('id').primaryKey(),
    revId: text('rev_id')
      .notNull()
      .references(() => revisions.id, { onDelete: 'cascade' }),
    filename: text('filename').notNull(),
    language: text('language').notNull(),
    content: text('content').notNull(),
    size: integer('size').notNull(),
  },
  (table) => ({
    revIdx: index('revision_files_rev_idx').on(table.revId),
  })
);

export const comments = sqliteTable(
  'comments',
  {
    id: text('id').primaryKey(),
    gistId: text('gist_id')
      .notNull()
      .references(() => gists.id, { onDelete: 'cascade' }),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    gistCreatedIdx: index('comments_gist_created_idx').on(
      table.gistId,
      table.createdAt
    ),
  })
);

export const stars = sqliteTable(
  'stars',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    gistId: text('gist_id')
      .notNull()
      .references(() => gists.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.gistId] }),
    gistIdx: index('stars_gist_idx').on(table.gistId),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type UserPassword = typeof userPasswords.$inferSelect;
export type NewUserPassword = typeof userPasswords.$inferInsert;

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;

export type Gist = typeof gists.$inferSelect;
export type NewGist = typeof gists.$inferInsert;

export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;

export type Revision = typeof revisions.$inferSelect;
export type NewRevision = typeof revisions.$inferInsert;

export type RevisionFile = typeof revisionFiles.$inferSelect;
export type NewRevisionFile = typeof revisionFiles.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type Star = typeof stars.$inferSelect;
export type NewStar = typeof stars.$inferInsert;


export const usersRelations = relations(users, ({ one, many }) => ({
  password: one(userPasswords, {
    fields: [users.id],
    references: [userPasswords.userId],
  }),
  sessions: many(userSessions),
  passwordResetTokens: many(passwordResetTokens),
  gists: many(gists),
  comments: many(comments),
  stars: many(stars),
}));

export const userPasswordsRelations = relations(userPasswords, ({ one }) => ({
  user: one(users, {
    fields: [userPasswords.userId],
    references: [users.id],
  }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const gistsRelations = relations(gists, ({ one, many }) => ({
  owner: one(users, {
    fields: [gists.ownerId],
    references: [users.id],
  }),
  files: many(files),
  revisions: many(revisions),
  comments: many(comments),
  stars: many(stars),
  sourceGist: one(gists, {
    fields: [gists.forkId],
    references: [gists.id],
  }),
  forks: many(gists),
}));

export const filesRelations = relations(files, ({ one }) => ({
  gist: one(gists, {
    fields: [files.gistId],
    references: [gists.id],
  }),
}));

export const revisionsRelations = relations(revisions, ({ one, many }) => ({
  gist: one(gists, {
    fields: [revisions.gistId],
    references: [gists.id],
  }),
  parentRevision: one(revisions, {
    fields: [revisions.parentRevId],
    references: [revisions.id],
  }),
  childRevisions: many(revisions),
  files: many(revisionFiles),
}));

export const revisionFilesRelations = relations(revisionFiles, ({ one }) => ({
  revision: one(revisions, {
    fields: [revisionFiles.revId],
    references: [revisions.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  gist: one(gists, {
    fields: [comments.gistId],
    references: [gists.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

export const starsRelations = relations(stars, ({ one }) => ({
  user: one(users, {
    fields: [stars.userId],
    references: [users.id],
  }),
  gist: one(gists, {
    fields: [stars.gistId],
    references: [gists.id],
  }),
}));