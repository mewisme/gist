import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getUserFromCookies } from '@/lib/auth';
import { CommentRepository } from '@/lib/repositories/comment-repository';

const commentRepository = new CommentRepository();

const createCommentSchema = z.object({
  gistId: z.string().min(1, 'Gist ID is required'),
  text: z.string().min(1, 'Comment text is required').max(1000, 'Comment too long'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createCommentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { gistId, text } = validationResult.data;

    const comment = await commentRepository.createComment({
      gistId,
      authorId: user.id,
      text,
    });

    const comments = await commentRepository.getCommentsByGist(gistId);
    const newComment = comments.find(c => c.id === comment.id);

    return NextResponse.json({
      success: true,
      comment: newComment
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
