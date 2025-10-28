import type { NotificationType } from '../repositories/notification-repository';
import { NotificationRepository } from '../repositories/notification-repository';
import { SubscriptionRepository } from '../repositories/subscription-repository';

export class NotificationService {
  private notificationRepo: NotificationRepository;
  private subscriptionRepo: SubscriptionRepository;

  constructor() {
    this.notificationRepo = new NotificationRepository();
    this.subscriptionRepo = new SubscriptionRepository();
  }

  /**
   * Trigger notification for gist created
   * Notifies users who subscribed to the gist owner
   */
  async notifyGistCreated(gistId: string, ownerId: string, gistTitle?: string): Promise<void> {
    const subscribers = await this.subscriptionRepo.getUserSubscribers(ownerId);

    if (subscribers.length === 0) return;

    await this.notificationRepo.createNotifications(subscribers, {
      type: 'gist_created',
      actorId: ownerId,
      gistId,
      metadata: {
        gistTitle,
      },
    });
  }

  /**
   * Trigger notification for gist updated
   * Notifies users who subscribed to the gist owner OR the specific gist
   */
  async notifyGistUpdated(gistId: string, ownerId: string, updaterId: string, gistTitle?: string): Promise<void> {
    const [gistSubscribers, ownerSubscribers] = await Promise.all([
      this.subscriptionRepo.getGistSubscribers(gistId),
      this.subscriptionRepo.getUserSubscribers(ownerId),
    ]);

    const allSubscribers = [...new Set([...gistSubscribers, ...ownerSubscribers])];

    if (allSubscribers.length === 0) return;

    await this.notificationRepo.createNotifications(allSubscribers, {
      type: 'gist_updated',
      actorId: updaterId,
      gistId,
      metadata: {
        gistTitle,
      },
    });
  }

  /**
   * Trigger notification for gist starred
   * Notifies the gist owner and users subscribed to the gist
   */
  async notifyGistStarred(gistId: string, ownerId: string, starrerUserId: string, gistTitle?: string): Promise<void> {
    const gistSubscribers = await this.subscriptionRepo.getGistSubscribers(gistId);

    const allRecipients = [...new Set([ownerId, ...gistSubscribers])];

    if (allRecipients.length === 0) return;

    await this.notificationRepo.createNotifications(allRecipients, {
      type: 'gist_starred',
      actorId: starrerUserId,
      gistId,
      metadata: {
        gistTitle,
      },
    });
  }

  /**
   * Trigger notification for gist unstarred
   * Notifies the gist owner and users subscribed to the gist
   */
  async notifyGistUnstarred(gistId: string, ownerId: string, unstarrerUserId: string, gistTitle?: string): Promise<void> {
    const gistSubscribers = await this.subscriptionRepo.getGistSubscribers(gistId);

    const allRecipients = [...new Set([ownerId, ...gistSubscribers])];

    if (allRecipients.length === 0) return;

    await this.notificationRepo.createNotifications(allRecipients, {
      type: 'gist_unstarred',
      actorId: unstarrerUserId,
      gistId,
      metadata: {
        gistTitle,
      },
    });
  }

  /**
   * Trigger notification for gist commented
   * Notifies the gist owner and users subscribed to the gist
   */
  async notifyGistCommented(
    gistId: string,
    ownerId: string,
    commenterId: string,
    commentId: string,
    gistTitle?: string,
    commentText?: string
  ): Promise<void> {
    const gistSubscribers = await this.subscriptionRepo.getGistSubscribers(gistId);

    const allRecipients = [...new Set([ownerId, ...gistSubscribers])];

    if (allRecipients.length === 0) return;

    await this.notificationRepo.createNotifications(allRecipients, {
      type: 'gist_commented',
      actorId: commenterId,
      gistId,
      commentId,
      metadata: {
        gistTitle,
        commentText: commentText ? commentText.substring(0, 100) : undefined,
      },
    });
  }

  /**
   * Trigger notification for gist forked
   * Notifies the original gist owner and users subscribed to the original gist
   */
  async notifyGistForked(
    originalGistId: string,
    originalOwnerId: string,
    forkerUserId: string,
    newGistId: string,
    gistTitle?: string
  ): Promise<void> {
    const gistSubscribers = await this.subscriptionRepo.getGistSubscribers(originalGistId);

    const allRecipients = [...new Set([originalOwnerId, ...gistSubscribers])];

    if (allRecipients.length === 0) return;

    await this.notificationRepo.createNotifications(allRecipients, {
      type: 'gist_forked',
      actorId: forkerUserId,
      gistId: originalGistId,
      metadata: {
        gistTitle,
        newGistId,
      },
    });
  }

  /**
   * Trigger notification for user followed
   * Notifies the user being followed
   */
  async notifyUserFollowed(
    targetUserId: string,
    followerUserId: string,
    followerName?: string
  ): Promise<void> {
    console.log('🔔 NotificationService.notifyUserFollowed called:', {
      targetUserId,
      followerUserId,
      followerName,
    });

    try {
      const notification = await this.notificationRepo.createNotification({
        userId: targetUserId,
        type: 'user_followed',
        actorId: followerUserId,
        metadata: {
          followerName,
        },
      });
      console.log('✅ User followed notification created:', notification.id);
    } catch (error: any) {
      console.error('❌ Error creating user followed notification:', {
        error: error.message,
        targetUserId,
        followerUserId,
        isSelfFollow: targetUserId === followerUserId,
      });
      throw error;
    }
  }

  /**
   * Bulk cleanup: Delete old read notifications
   */
  async cleanupOldNotifications(daysOld = 30): Promise<number> {
    return await this.notificationRepo.deleteOldReadNotifications(daysOld);
  }
}

export const notificationService = new NotificationService();

