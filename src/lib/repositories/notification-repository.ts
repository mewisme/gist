import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';

import { generateId } from '@/lib/id-utils';

import { db } from '../db';
import type { Notification, NotificationWithActor } from '../db/schema';
import { gists, notifications, users } from '../db/schema';

export type NotificationType =
  | 'gist_created'
  | 'gist_updated'
  | 'gist_starred'
  | 'gist_unstarred'
  | 'gist_commented'
  | 'gist_forked'
  | 'user_followed';

export class NotificationRepository {
  /**
   * Create a notification
   */
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    actorId: string;
    gistId?: string;
    commentId?: string;
    metadata?: {
      gistTitle?: string;
      commentText?: string;
      [key: string]: any;
    };
  }): Promise<Notification> {
    if (data.userId === data.actorId) {
      throw new Error('Cannot create notification for own action');
    }

    const [notification] = await db
      .insert(notifications)
      .values({
        id: generateId(),
        userId: data.userId,
        type: data.type,
        actorId: data.actorId,
        gistId: data.gistId || null,
        commentId: data.commentId || null,
        metadata: data.metadata || {},
        read: false,
      })
      .returning();

    return notification;
  }

  /**
   * Create notifications for multiple users
   */
  async createNotifications(
    userIds: string[],
    data: {
      type: NotificationType;
      actorId: string;
      gistId?: string;
      commentId?: string;
      metadata?: {
        gistTitle?: string;
        commentText?: string;
        [key: string]: any;
      };
    }
  ): Promise<Notification[]> {
    const recipients = userIds.filter(id => id !== data.actorId);

    if (recipients.length === 0) {
      return [];
    }

    const notificationData = recipients.map(userId => ({
      id: generateId(),
      userId,
      type: data.type,
      actorId: data.actorId,
      gistId: data.gistId || null,
      commentId: data.commentId || null,
      metadata: data.metadata || {},
      read: false,
    }));

    const result = await db
      .insert(notifications)
      .values(notificationData)
      .returning();

    return result;
  }

  /**
   * Get notifications for a user with pagination
   */
  async getNotifications(
    userId: string,
    limit = 20,
    offset = 0,
    unreadOnly = false
  ): Promise<{ notifications: NotificationWithActor[]; total: number }> {
    const whereCondition = unreadOnly
      ? and(eq(notifications.userId, userId), eq(notifications.read, false))
      : eq(notifications.userId, userId);

    const [totalResult] = await db
      .select({ count: count() })
      .from(notifications)
      .where(whereCondition);

    const total = totalResult.count;

    const result = await db
      .select({
        notification: notifications,
        actor: users,
        gist: gists,
      })
      .from(notifications)
      .leftJoin(users, eq(users.id, notifications.actorId))
      .leftJoin(gists, eq(gists.id, notifications.gistId))
      .where(whereCondition)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      notifications: result.map(r => ({
        ...r.notification,
        actor: r.actor!,
        gist: r.gist || undefined,
      })),
      total,
    };
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );

    return result.count;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    const result = db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, notificationId))
      .run();

    return result.changes > 0;
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: string[]): Promise<number> {
    if (notificationIds.length === 0) return 0;

    const result = db
      .update(notifications)
      .set({ read: true })
      .where(inArray(notifications.id, notificationIds))
      .run();

    return result.changes;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      )
      .run();

    return result.changes;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    const result = db
      .delete(notifications)
      .where(eq(notifications.id, notificationId))
      .run();

    return result.changes > 0;
  }

  /**
   * Delete multiple notifications
   */
  async deleteMultipleNotifications(notificationIds: string[]): Promise<number> {
    if (notificationIds.length === 0) return 0;

    const result = db
      .delete(notifications)
      .where(inArray(notifications.id, notificationIds))
      .run();

    return result.changes;
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string): Promise<number> {
    const result = db
      .delete(notifications)
      .where(eq(notifications.userId, userId))
      .run();

    return result.changes;
  }

  /**
   * Delete old read notifications (older than specified days)
   */
  async deleteOldReadNotifications(daysOld = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = db
      .delete(notifications)
      .where(
        and(
          eq(notifications.read, true),
          sql`${notifications.createdAt} < ${Math.floor(cutoffDate.getTime() / 1000)}`
        )
      )
      .run();

    return result.changes;
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(notificationId: string): Promise<NotificationWithActor | null> {
    const result = await db
      .select({
        notification: notifications,
        actor: users,
        gist: gists,
      })
      .from(notifications)
      .leftJoin(users, eq(users.id, notifications.actorId))
      .leftJoin(gists, eq(gists.id, notifications.gistId))
      .where(eq(notifications.id, notificationId))
      .limit(1);

    if (result.length === 0) return null;

    return {
      ...result[0].notification,
      actor: result[0].actor!,
      gist: result[0].gist || undefined,
    };
  }

  /**
   * Get recent notifications summary (for badge display)
   */
  async getNotificationsSummary(userId: string): Promise<{
    unreadCount: number;
    recentUnread: NotificationWithActor[];
  }> {
    const unreadCount = await this.getUnreadCount(userId);

    const result = await db
      .select({
        notification: notifications,
        actor: users,
        gist: gists,
      })
      .from(notifications)
      .leftJoin(users, eq(users.id, notifications.actorId))
      .leftJoin(gists, eq(gists.id, notifications.gistId))
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(5);

    return {
      unreadCount,
      recentUnread: result.map(r => ({
        ...r.notification,
        actor: r.actor!,
        gist: r.gist || undefined,
      })),
    };
  }
}

