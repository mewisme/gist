import { and, eq, sql } from 'drizzle-orm';

import { db } from '../db';
import { gists, stars } from '../db/schema';
import { notificationService } from '../services/notification-service';

export class StarRepository {
  /**
   * Toggle star for a gist
   */
  async toggleStar(gistId: string, userId: string): Promise<{ starred: boolean; starCount: number }> {
    const [gistData] = await db
      .select({ ownerId: gists.ownerId, title: gists.title })
      .from(gists)
      .where(eq(gists.id, gistId))
      .limit(1);

    if (!gistData) {
      throw new Error('Gist not found');
    }
    const existingStar = await db
      .select()
      .from(stars)
      .where(
        and(
          eq(stars.gistId, gistId),
          eq(stars.userId, userId)
        )
      )
      .limit(1);

    if (existingStar.length > 0) {
      db
        .delete(stars)
        .where(
          and(
            eq(stars.gistId, gistId),
            eq(stars.userId, userId)
          )
        )
        .run();

      await db
        .update(gists)
        .set({
          starCount: sql`star_count - 1`,
        })
        .where(eq(gists.id, gistId));

      const [gist] = await db
        .select({ starCount: gists.starCount })
        .from(gists)
        .where(eq(gists.id, gistId))
        .limit(1);

      notificationService.notifyGistUnstarred(
        gistId,
        gistData.ownerId,
        userId,
        gistData.title || undefined
      ).catch(err => console.error('Failed to send unstar notification:', err));

      return { starred: false, starCount: gist.starCount };
    } else {
      db
        .insert(stars)
        .values({
          gistId,
          userId,
        })
        .run();

      await db
        .update(gists)
        .set({
          starCount: sql`star_count + 1`,
        })
        .where(eq(gists.id, gistId));

      const [gist] = await db
        .select({ starCount: gists.starCount })
        .from(gists)
        .where(eq(gists.id, gistId))
        .limit(1);

      notificationService.notifyGistStarred(
        gistId,
        gistData.ownerId,
        userId,
        gistData.title || undefined
      ).catch(err => console.error('Failed to send star notification:', err));

      return { starred: true, starCount: gist.starCount };
    }
  }

  /**
   * Check if user has starred a gist
   */
  async isStarred(gistId: string, userId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(stars)
      .where(
        and(
          eq(stars.gistId, gistId),
          eq(stars.userId, userId)
        )
      )
      .limit(1);

    return result.length > 0;
  }

  /**
   * Get starred gists for a user
   */
  async getStarredGists(userId: string): Promise<string[]> {
    const result = await db
      .select({ gistId: stars.gistId })
      .from(stars)
      .where(eq(stars.userId, userId));

    return result.map(r => r.gistId);
  }
}
