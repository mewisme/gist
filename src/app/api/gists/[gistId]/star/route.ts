import { NextRequest, NextResponse } from 'next/server';

import { getUserFromCookies } from '@/lib/auth';
import { StarRepository } from '@/lib/repositories/star-repository';

const starRepository = new StarRepository();

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

    const result = await starRepository.toggleStar(gistId, user.id);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error toggling star:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gistId: string }> }
) {
  try {
    const user = await getUserFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gistId } = await params;

    const isStarred = await starRepository.isStarred(gistId, user.id);

    return NextResponse.json({
      success: true,
      data: { starred: isStarred }
    });
  } catch (error) {
    console.error('Error checking star status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
