import { NextRequest, NextResponse } from 'next/server';

import { getUserFromCookies } from '@/lib/auth';
import { SubscriptionRepository } from '@/lib/repositories/subscription-repository';

const subscriptionRepository = new SubscriptionRepository();

/**
 * Subscribe to a gist
 */
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

    const subscription = await subscriptionRepository.subscribeToGist(user.id, gistId);

    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error('Error subscribing to gist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Unsubscribe from a gist
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gistId: string }> }
) {
  try {
    const user = await getUserFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gistId } = await params;

    const success = await subscriptionRepository.unsubscribeFromGist(user.id, gistId);

    return NextResponse.json({
      success,
    });
  } catch (error) {
    console.error('Error unsubscribing from gist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check if subscribed to a gist
 */
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

    const isSubscribed = await subscriptionRepository.isSubscribedToGist(user.id, gistId);

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

