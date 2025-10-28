import { and, count, desc, eq, isNotNull, or } from 'drizzle-orm';

import { generateId } from '@/lib/id-utils';

import { db } from '../db';
import type { Subscription, User } from '../db/schema';
import { gists, subscriptions, users } from '../db/schema';

export class SubscriptionRepository {
  /**
   * Subscribe to a user
   */
  async subscribeToUser(subscriberId: string, targetUserId: string): Promise<Subscription> {
    if (subscriberId === targetUserId) {
      throw new Error('Cannot subscribe to yourself');
    }

    const [subscription] = await db
      .insert(subscriptions)
      .values({
        id: generateId(),
        subscriberId,
        targetUserId,
        targetGistId: null,
      })
      .onConflictDoNothing()
      .returning();

    return subscription;
  }

  /**
   * Unsubscribe from a user
   */
  async unsubscribeFromUser(subscriberId: string, targetUserId: string): Promise<boolean> {
    const result = db
      .delete(subscriptions)
      .where(
        and(
          eq(subscriptions.subscriberId, subscriberId),
          eq(subscriptions.targetUserId, targetUserId)
        )
      )
      .run();

    return result.changes > 0;
  }

  /**
   * Subscribe to a gist
   */
  async subscribeToGist(subscriberId: string, targetGistId: string): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        id: generateId(),
        subscriberId,
        targetUserId: null,
        targetGistId,
      })
      .onConflictDoNothing()
      .returning();

    return subscription;
  }

  /**
   * Unsubscribe from a gist
   */
  async unsubscribeFromGist(subscriberId: string, targetGistId: string): Promise<boolean> {
    const result = db
      .delete(subscriptions)
      .where(
        and(
          eq(subscriptions.subscriberId, subscriberId),
          eq(subscriptions.targetGistId, targetGistId)
        )
      )
      .run();

    return result.changes > 0;
  }

  /**
   * Check if user is subscribed to another user
   */
  async isSubscribedToUser(subscriberId: string, targetUserId: string): Promise<boolean> {
    const result = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.subscriberId, subscriberId),
          eq(subscriptions.targetUserId, targetUserId)
        )
      )
      .limit(1);

    return result.length > 0;
  }

  /**
   * Check if user is subscribed to a gist
   */
  async isSubscribedToGist(subscriberId: string, targetGistId: string): Promise<boolean> {
    const result = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.subscriberId, subscriberId),
          eq(subscriptions.targetGistId, targetGistId)
        )
      )
      .limit(1);

    return result.length > 0;
  }

  /**
   * Get all user IDs subscribed to a specific user
   */
  async getUserSubscribers(targetUserId: string): Promise<string[]> {
    const result = await db
      .select({ subscriberId: subscriptions.subscriberId })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.targetUserId, targetUserId),
          isNotNull(subscriptions.targetUserId)
        )
      );

    return result.map(r => r.subscriberId);
  }

  /**
   * Get all user IDs subscribed to a specific gist
   */
  async getGistSubscribers(targetGistId: string): Promise<string[]> {
    const result = await db
      .select({ subscriberId: subscriptions.subscriberId })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.targetGistId, targetGistId),
          isNotNull(subscriptions.targetGistId)
        )
      );

    return result.map(r => r.subscriberId);
  }

  /**
   * Get all subscribers (user IDs) for a gist owner
   * This includes users who subscribed to the gist owner
   */
  async getGistOwnerSubscribers(ownerId: string): Promise<string[]> {
    return this.getUserSubscribers(ownerId);
  }

  /**
   * Get all user subscriptions (users the subscriber is following)
   */
  async getUserSubscriptions(
    subscriberId: string,
    limit = 20,
    offset = 0
  ): Promise<{ users: User[]; total: number }> {
    const [totalResult] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.subscriberId, subscriberId),
          isNotNull(subscriptions.targetUserId)
        )
      );

    const total = totalResult.count;

    const result = await db
      .select({
        user: users,
      })
      .from(subscriptions)
      .leftJoin(users, eq(users.id, subscriptions.targetUserId))
      .where(
        and(
          eq(subscriptions.subscriberId, subscriberId),
          isNotNull(subscriptions.targetUserId)
        )
      )
      .orderBy(desc(subscriptions.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      users: result.map(r => r.user!),
      total,
    };
  }

  /**
   * Get all gist subscriptions
   */
  async getGistSubscriptions(
    subscriberId: string,
    limit = 20,
    offset = 0
  ): Promise<{ gistIds: string[]; total: number }> {
    const [totalResult] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.subscriberId, subscriberId),
          isNotNull(subscriptions.targetGistId)
        )
      );

    const total = totalResult.count;

    const result = await db
      .select({
        gistId: subscriptions.targetGistId,
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.subscriberId, subscriberId),
          isNotNull(subscriptions.targetGistId)
        )
      )
      .orderBy(desc(subscriptions.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      gistIds: result.map(r => r.gistId!),
      total,
    };
  }

  /**
   * Get users subscribed to the given user (followers)
   */
  async getFollowers(
    targetUserId: string,
    limit = 20,
    offset = 0
  ): Promise<{ users: User[]; total: number }> {
    const [totalResult] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.targetUserId, targetUserId),
          isNotNull(subscriptions.targetUserId)
        )
      );

    const total = totalResult.count;

    const result = await db
      .select({
        user: users,
      })
      .from(subscriptions)
      .leftJoin(users, eq(users.id, subscriptions.subscriberId))
      .where(
        and(
          eq(subscriptions.targetUserId, targetUserId),
          isNotNull(subscriptions.targetUserId)
        )
      )
      .orderBy(desc(subscriptions.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      users: result.map(r => r.user!),
      total,
    };
  }

  /**
   * Get subscription counts for a user
   */
  async getSubscriptionCounts(userId: string): Promise<{
    following: number;
    followers: number;
    gistSubscriptions: number;
  }> {
    const [followingResult] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.subscriberId, userId),
          isNotNull(subscriptions.targetUserId)
        )
      );

    const [followersResult] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.targetUserId, userId),
          isNotNull(subscriptions.targetUserId)
        )
      );

    const [gistSubsResult] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.subscriberId, userId),
          isNotNull(subscriptions.targetGistId)
        )
      );

    return {
      following: followingResult.count,
      followers: followersResult.count,
      gistSubscriptions: gistSubsResult.count,
    };
  }
}

