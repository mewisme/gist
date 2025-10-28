'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth/auth-context';
import { Button } from '@/components/ui/button';

export function NotificationButton() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/notifications/unread-count', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.data.count);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [user, pathname]);

  if (!user) {
    return null;
  }

  return (
    <Button variant="ghost" size="icon" className="relative shrink-0" asChild>
      <Link href="/notifications" aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>
    </Button>
  );
}

