import { NextRequest, NextResponse } from 'next/server';

import { getUserFromCookies } from '@/lib/auth';
import { GistRepository } from '@/lib/repositories/gist-repository';

const gistRepository = new GistRepository();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gistId: string }> }
) {
  try {
    const user = await getUserFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gistId } = await params;

    const sourceGist = await gistRepository.getGistById(gistId);
    if (!sourceGist) {
      return NextResponse.json({ error: 'Gist not found' }, { status: 404 });
    }

    if (sourceGist.ownerId === user.id) {
      return NextResponse.json({ error: 'Cannot fork your own gist' }, { status: 400 });
    }

    const forkedGist = await gistRepository.forkGist(gistId, user.id);

    if (!forkedGist) {
      return NextResponse.json({ error: 'Failed to fork gist' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        forkedGist,
        message: 'Gist forked successfully'
      }
    });
  } catch (error) {
    console.error('Error forking gist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
