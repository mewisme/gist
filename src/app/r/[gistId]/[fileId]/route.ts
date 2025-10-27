import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db, files } from '@/lib/db';
import { GistRepository } from '@/lib/repositories/gist-repository';

const gistRepository = new GistRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gistId: string; fileId: string }> }
) {
  try {
    const { gistId, fileId } = await params;

    const file = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (file.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (file[0].gistId !== gistId) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const gist = await gistRepository.getGistById(gistId);
    if (!gist) {
      return NextResponse.json({ error: 'Gist not found' }, { status: 404 });
    }

    return new NextResponse(file[0].content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Filename': file[0].filename,
      },
    });
  } catch (error) {
    console.error('Raw file error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}