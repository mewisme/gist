import { NextRequest, NextResponse } from 'next/server';

import { getUserFromCookies } from '@/lib/auth';
import { NotificationRepository } from '@/lib/repositories/notification-repository';

const notificationRepository = new NotificationRepository();

/**
 * Get user's notifications
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const result = await notificationRepository.getNotifications(
      user.id,
      limit,
      offset,
      unreadOnly
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Mark all notifications as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await notificationRepository.markAllAsRead(user.id);

    return NextResponse.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete all notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await notificationRepository.deleteAllNotifications(user.id);

    return NextResponse.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

