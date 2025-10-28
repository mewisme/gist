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
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.gistId] }),
    gistIdx: index('stars_gist_idx').on(table.gistId),
  })
);

// Subscriptions table - supports both user-to-user and user-to-gist subscriptions
export const subscriptions = sqliteTable(
  'subscriptions',
  {
    id: text('id').primaryKey(),
    subscriberId: text('subscriber_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Either targetUserId or targetGistId should be set, not both
    targetUserId: text('target_user_id')
      .references(() => users.id, { onDelete: 'cascade' }),
    targetGistId: text('target_gist_id')
      .references(() => gists.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    // Composite unique indexes to prevent duplicate subscriptions
    subscriberUserIdx: unique('subscriptions_subscriber_user_idx').on(
      table.subscriberId,
      table.targetUserId
    ),
    subscriberGistIdx: unique('subscriptions_subscriber_gist_idx').on(
      table.subscriberId,
      table.targetGistId
    ),
    // Index for finding all subscribers of a user
    targetUserIdx: index('subscriptions_target_user_idx').on(table.targetUserId),
    // Index for finding all subscribers of a gist
    targetGistIdx: index('subscriptions_target_gist_idx').on(table.targetGistId),
    // Index for finding all subscriptions by a user
    subscriberIdx: index('subscriptions_subscriber_idx').on(table.subscriberId),
  })
);

// Notifications table
export const notifications = sqliteTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type', {
      enum: ['gist_created', 'gist_updated', 'gist_starred', 'gist_unstarred', 'gist_commented', 'gist_forked', 'user_followed'],
    }).notNull(),
    // Actor who performed the action
    actorId: text('actor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Related gist
    gistId: text('gist_id')
      .references(() => gists.id, { onDelete: 'cascade' }),
    // Related comment (if type is gist_commented)
    commentId: text('comment_id')
      .references(() => comments.id, { onDelete: 'cascade' }),
    // Additional metadata (JSON)
    metadata: text('metadata', { mode: 'json' }).$type<{
      gistTitle?: string;
      commentText?: string;
      [key: string]: any;
    }>(),
    read: integer('read', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    // Compound index for efficient querying of user's unread notifications
    userReadCreatedIdx: index('notifications_user_read_created_idx').on(
      table.userId,
      table.read,
      table.createdAt
    ),
    // Index for finding notifications by user (for pagination)
    userCreatedIdx: index('notifications_user_created_idx').on(
      table.userId,
      table.createdAt
    ),
    // Index for finding notifications by gist
    gistIdx: index('notifications_gist_idx').on(table.gistId),
    // Index for finding notifications by actor
    actorIdx: index('notifications_actor_idx').on(table.actorId),
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

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type UserRelations = typeof usersRelations;
export type UserPasswordRelations = typeof userPasswordsRelations;
export type UserSessionRelations = typeof userSessionsRelations;
export type PasswordResetTokenRelations = typeof passwordResetTokensRelations;
export type GistRelations = typeof gistsRelations;
export type FileRelations = typeof filesRelations;
export type RevisionRelations = typeof revisionsRelations;
export type RevisionFileRelations = typeof revisionFilesRelations;
export type CommentRelations = typeof commentsRelations;
export type StarRelations = typeof starsRelations;
export type SubscriptionRelations = typeof subscriptionsRelations;
export type NotificationRelations = typeof notificationsRelations;

export type GistOwner = Gist & { owner: User }
export type GistDetails = GistOwner & { files: File[]; commentCount: number; forkData?: GistOwner }
export type NotificationWithActor = Notification & { actor: User; gist?: Gist }

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
  subscriptions: many(subscriptions, { relationName: 'subscriberSubscriptions' }),
  subscribers: many(subscriptions, { relationName: 'userSubscribers' }),
  notifications: many(notifications, { relationName: 'userNotifications' }),
  triggeredNotifications: many(notifications, { relationName: 'actorNotifications' }),
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
  subscriptions: many(subscriptions),
  notifications: many(notifications),
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

export const commentsRelations = relations(comments, ({ one, many }) => ({
  gist: one(gists, {
    fields: [comments.gistId],
    references: [gists.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  notifications: many(notifications),
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

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  subscriber: one(users, {
    fields: [subscriptions.subscriberId],
    references: [users.id],
    relationName: 'subscriberSubscriptions',
  }),
  targetUser: one(users, {
    fields: [subscriptions.targetUserId],
    references: [users.id],
    relationName: 'userSubscribers',
  }),
  targetGist: one(gists, {
    fields: [subscriptions.targetGistId],
    references: [gists.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
    relationName: 'userNotifications',
  }),
  actor: one(users, {
    fields: [notifications.actorId],
    references: [users.id],
    relationName: 'actorNotifications',
  }),
  gist: one(gists, {
    fields: [notifications.gistId],
    references: [gists.id],
  }),
  comment: one(comments, {
    fields: [notifications.commentId],
    references: [comments.id],
  }),
}));