import { and, desc, eq } from 'drizzle-orm';

import { generateId } from '@/lib/id-utils';

import { db } from '../db';
import type { Comment, User } from '../db/schema';
import { comments, users } from '../db/schema';

export class CommentRepository {
  /**
   * Create a new comment
   */
  async createComment(data: {
    gistId: string;
    authorId: string;
    text: string;
  }): Promise<Comment> {
    const now = new Date();

    const [comment] = await db
      .insert(comments)
      .values({
        id: generateId(),
        gistId: data.gistId,
        authorId: data.authorId,
        text: data.text,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return comment;
  }

  /**
   * Get comments for a gist with authors
   */
  async getCommentsByGist(gistId: string): Promise<(Comment & { author: User })[]> {
    const result = await db
      .select({
        comment: comments,
        author: users,
      })
      .from(comments)
      .leftJoin(users, eq(users.id, comments.authorId))
      .where(eq(comments.gistId, gistId))
      .orderBy(desc(comments.createdAt));

    return result.map(r => ({ ...r.comment, author: r.author! }));
  }

  /**
   * Update comment
   */
  async updateComment(commentId: string, text: string, authorId: string): Promise<Comment | null> {
    const [comment] = await db
      .update(comments)
      .set({
        text,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(comments.id, commentId),
          eq(comments.authorId, authorId)
        )
      )
      .returning();

    return comment || null;
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId: string, authorId: string): Promise<boolean> {
    const result = db
      .delete(comments)
      .where(
        and(
          eq(comments.id, commentId),
          eq(comments.authorId, authorId)
        )
      )
      .run();

    return result.changes > 0;
  }

  /**
   * Delete comment by gist owner
   */
  async deleteCommentByOwner(commentId: string, gistId: string, ownerId: string): Promise<boolean> {
    const result = db
      .delete(comments)
      .where(
        and(
          eq(comments.id, commentId),
          eq(comments.gistId, gistId)
        )
      )
      .run();

    return result.changes > 0;
  }
}
