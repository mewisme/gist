import { and, eq, sql } from 'drizzle-orm';

import { db } from '../db';
import { gists, stars } from '../db/schema';

export class StarRepository {
  /**
   * Toggle star for a gist
   */
  async toggleStar(gistId: string, userId: string): Promise<{ starred: boolean; starCount: number }> {
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
