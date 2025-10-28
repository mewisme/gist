import { NextRequest, NextResponse } from 'next/server';

import { getUserFromCookies } from '@/lib/auth';
import { NotificationRepository } from '@/lib/repositories/notification-repository';

const notificationRepository = new NotificationRepository();

/**
 * Get unread notification count
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await notificationRepository.getUnreadCount(user.id);

    return NextResponse.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

