import { NextRequest, NextResponse } from 'next/server';

import { getUserFromCookies } from '@/lib/auth';
import { SubscriptionRepository } from '@/lib/repositories/subscription-repository';

const subscriptionRepository = new SubscriptionRepository();

/**
 * Get current user's subscriptions and follower counts
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const counts = await subscriptionRepository.getSubscriptionCounts(user.id);

    return NextResponse.json({
      success: true,
      data: counts,
    });
  } catch (error) {
    console.error('Error getting subscription counts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

