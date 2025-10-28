'use client';

import { formatDistanceToNow } from 'date-fns';
import { Bell, BellOff, Check, CheckCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '@/components/auth/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { NotificationWithActor } from '@/lib/db/schema';

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationWithActor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/signin');
      return;
    }

    fetchNotifications();
  }, [user, authLoading, filter, router]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/notifications?limit=50&offset=0&unreadOnly=${filter === 'unread'}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: NotificationWithActor) => {
    if (!notification.read) {
      try {
        await fetch(`/api/notifications/${notification.id}`, {
          method: 'PATCH',
          credentials: 'include',
        });

        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    const url = getNotificationUrl(notification);
    if (url) {
      router.push(url);
    }
  };

  const getNotificationUrl = (notification: NotificationWithActor): string | null => {
    if (notification.type === 'user_followed') {
      return `/u/${notification.actor.handle}`;
    }
    if (notification.gistId) {
      return `/g/${notification.gistId}`;
    }
    return null;
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('All notifications marked as read');
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Notification deleted');
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setTotal(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationMessage = (notification: NotificationWithActor): string => {
    const actorName = notification.actor.displayName;
    const gistTitle = notification.metadata?.gistTitle || 'a gist';

    switch (notification.type) {
      case 'gist_created':
        return `${actorName} created ${gistTitle}`;
      case 'gist_updated':
        return `${actorName} updated ${gistTitle}`;
      case 'gist_starred':
        return `${actorName} starred ${gistTitle}`;
      case 'gist_unstarred':
        return `${actorName} unstarred ${gistTitle}`;
      case 'gist_commented':
        return `${actorName} commented on ${gistTitle}`;
      case 'gist_forked':
        return `${actorName} forked ${gistTitle}`;
      case 'user_followed':
        return `${actorName} followed you`;
      default:
        return 'New activity';
    }
  };

  if (authLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Notifications</h1>

        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread
          </Button>
          {notifications.some(n => !n.read) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="ml-2"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            {filter === 'unread' ? (
              <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
            ) : (
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            )}
            <h3 className="text-lg font-semibold mb-2">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-muted-foreground text-center">
              {filter === 'unread'
                ? "You're all caught up!"
                : "You'll receive notifications when people interact with your gists or when you subscribe to users and gists."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map(notification => (
            <Card
              key={notification.id}
              className={`cursor-pointer transition-colors hover:bg-accent ${!notification.read ? 'bg-primary/5 border-primary/20' : ''
                }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage
                    src={notification.actor.photoUrl || undefined}
                    alt={notification.actor.displayName}
                  />
                  <AvatarFallback>
                    {notification.actor.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <Link
                      href={`/u/${notification.actor.handle}`}
                      className="font-semibold hover:underline"
                      onClick={e => e.stopPropagation()}
                    >
                      {notification.actor.displayName}
                    </Link>
                    {' '}
                    <span className="text-muted-foreground">
                      {getNotificationMessage(notification).replace(notification.actor.displayName, '').trim()}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-primary" title="Unread" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={e => deleteNotification(notification.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

