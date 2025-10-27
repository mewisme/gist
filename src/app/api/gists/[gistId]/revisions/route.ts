import { NextRequest, NextResponse } from 'next/server';

import { GistRepository } from '@/lib/repositories/gist-repository';

const gistRepository = new GistRepository();

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

    const revisions = await gistRepository.getRevisions(gistId);

    return NextResponse.json({
      success: true,
      revisions,
    });
  } catch (error) {
    console.error('Error fetching revisions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
