import { NextRequest, NextResponse } from 'next/server';

import { GistRepository } from '@/lib/repositories/gist-repository';

const gistRepository = new GistRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gistId: string; revisionId: string }> }
) {
  try {
    const { gistId, revisionId } = await params;

    const gist = await gistRepository.getGistById(gistId);
    if (!gist) {
      return NextResponse.json({ error: 'Gist not found' }, { status: 404 });
    }

    const revision = await gistRepository.getRevisionWithFiles(revisionId);
    if (!revision) {
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
    }

    if (revision.gistId !== gistId) {
      return NextResponse.json({ error: 'Revision not found for this gist' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      revision,
      gist,
    });
  } catch (error) {
    console.error('Error fetching revision:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
