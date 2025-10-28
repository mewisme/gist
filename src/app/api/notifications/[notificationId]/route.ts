import { NextRequest, NextResponse } from 'next/server';

import { getUserFromCookies } from '@/lib/auth';
import { NotificationRepository } from '@/lib/repositories/notification-repository';

const notificationRepository = new NotificationRepository();

/**
 * Mark a notification as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const user = await getUserFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId } = await params;

    const success = await notificationRepository.markAsRead(notificationId);

    return NextResponse.json({
      success,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete a notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const user = await getUserFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId } = await params;

    const success = await notificationRepository.deleteNotification(notificationId);

    return NextResponse.json({
      success,
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

