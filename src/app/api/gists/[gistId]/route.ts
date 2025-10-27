import { NextRequest, NextResponse } from 'next/server';

import { CommentRepository } from '@/lib/repositories/comment-repository';
import { GistRepository } from '@/lib/repositories/gist-repository';

const gistRepository = new GistRepository();
const commentRepository = new CommentRepository();


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gistId: string }> }
) {
  try {
    const { gistId } = await params;

    const gist = await gistRepository.getGistById(gistId);
    if (!gist) {
      return NextResponse.json({ error: 'Gist not found' }, { status: 404 });
    }

    const comments = await commentRepository.getCommentsByGist(gistId);

    return NextResponse.json({
      gist,
      comments,
    });
  } catch (error) {
    console.error('Error fetching gist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
