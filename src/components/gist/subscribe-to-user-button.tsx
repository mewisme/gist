'use client';

import { Bell, BellOff } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '@/components/auth/auth-context';
import { Button } from '@/components/ui/button';

interface SubscribeToUserButtonProps {
  userId: string;
  userName?: string;
}

export function SubscribeToUserButton({ userId, userName }: SubscribeToUserButtonProps) {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user) {
        setIsCheckingStatus(false);
        return;
      }

      if (user.id === userId) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        const response = await fetch(`/api/subscriptions/users/${userId}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setIsSubscribed(data.data.subscribed);
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkSubscriptionStatus();
  }, [userId, user]);

  const handleSubscribeToggle = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/subscriptions/users/${userId}`, {
        method: isSubscribed ? 'DELETE' : 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setIsSubscribed(!isSubscribed);
        toast.success(
          isSubscribed
            ? `Unsubscribed from ${userName || 'user'}`
            : `Subscribed to ${userName || 'user'}`
        );
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update subscription');
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.id === userId) {
    return null;
  }

  if (!user) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/signin">
          <Bell className="h-4 w-4 mr-2" />
          Subscribe
        </Link>
      </Button>
    );
  }

  if (isCheckingStatus) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Bell className="h-4 w-4 mr-2" />
        Subscribe
      </Button>
    );
  }

  return (
    <Button
      variant={isSubscribed ? "secondary" : "outline"}
      size="sm"
      onClick={handleSubscribeToggle}
      disabled={isLoading}
    >
      {isSubscribed ? (
        <BellOff className="h-4 w-4 mr-2" />
      ) : (
        <Bell className="h-4 w-4 mr-2" />
      )}
      {isLoading ? '...' : isSubscribed ? 'Unsubscribe' : 'Subscribe'}
    </Button>
  );
}

