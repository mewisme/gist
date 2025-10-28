import { NextRequest, NextResponse } from 'next/server';

import { getUserFromCookies } from '@/lib/auth';
import { SubscriptionRepository } from '@/lib/repositories/subscription-repository';
import { notificationService } from '@/lib/services/notification-service';

const subscriptionRepository = new SubscriptionRepository();

/**
 * Subscribe to a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getUserFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    const subscription = await subscriptionRepository.subscribeToUser(user.id, userId);

    notificationService
      .notifyUserFollowed(userId, user.id, user.displayName)
      .then(() => {
        console.log(`✅ User followed notification sent: ${user.displayName} (${user.id}) -> target user (${userId})`);
      })
      .catch((error) => {
        console.error('❌ Error sending user followed notification:', error);
        console.error('Details:', {
          targetUserId: userId,
          followerUserId: user.id,
          followerName: user.displayName,
          errorMessage: error.message,
          errorStack: error.stack,
        });
      });

    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error: any) {
    console.error('Error subscribing to user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Unsubscribe from a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getUserFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    const success = await subscriptionRepository.unsubscribeFromUser(user.id, userId);

    return NextResponse.json({
      success,
    });
  } catch (error) {
    console.error('Error unsubscribing from user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check if subscribed to a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getUserFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    const isSubscribed = await subscriptionRepository.isSubscribedToUser(user.id, userId);

    return NextResponse.json({
      success: true,
      data: { subscribed: isSubscribed },
    });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

