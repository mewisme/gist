'use client';

import { Bell, BellOff, CodeIcon, Download, Edit, Ellipsis, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { deleteGist } from '@/app/actions/gist-actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/animate-ui/components/radix/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/animate-ui/components/radix/dropdown-menu';
import { useAuth } from '@/components/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Comment, Gist, User } from '@/lib/db/schema';

interface GistActionsDropdownProps {
  gist: Gist & { owner: User };
  comments: Comment[];
}


export function GistActionsWithDropdown({ gist, comments }: GistActionsDropdownProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const isOwner = user && user.id === gist.owner.id;

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user || isOwner) {
        setIsCheckingSubscription(false);
        return;
      }

      try {
        const response = await fetch(`/api/subscriptions/gists/${gist.id}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setIsSubscribed(data.data.subscribed);
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
      } finally {
        setIsCheckingSubscription(false);
      }
    };

    checkSubscriptionStatus();
  }, [gist.id, user, isOwner]);

  const handleSubscribeToggle = async () => {
    if (!user) {
      router.push('/signin');
      return;
    }

    setIsSubscribing(true);

    try {
      const response = await fetch(`/api/subscriptions/gists/${gist.id}`, {
        method: isSubscribed ? 'DELETE' : 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setIsSubscribed(!isSubscribed);
        toast.success(
          isSubscribed
            ? 'Unsubscribed from gist notifications'
            : 'Subscribed to gist notifications'
        );
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update subscription');
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDelete = async () => {
    if (!gist) return;

    try {
      const result = await deleteGist(gist.id);

      if (result.success) {
        toast.success('Gist deleted successfully');
        router.push('/discover');
      } else {
        toast.error(result.error || 'Failed to delete gist');
      }
    } catch (error) {
      console.error('Error deleting gist:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const copyEmbedScript = async () => {
    const embedScript = `<iframe src="${window.location.origin}/e/${gist.id}" width="100%" height="400" frameborder="0"></iframe>`;
    try {
      await navigator.clipboard.writeText(embedScript);
      toast.success('Embed script copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy embed script:', error);
      toast.error('Failed to copy embed script');
    }
  };

  return (
    <>
      <AlertDialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className='md:hidden'>
              <Ellipsis className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-40'
            align='start'
            side='top'
          >
            {/* Subscribe option for non-owners */}
            {!isOwner && user && (
              <>
                <DropdownMenuItem
                  onClick={handleSubscribeToggle}
                  disabled={isSubscribing || isCheckingSubscription}
                >
                  <div className="w-full flex items-center">
                    {isSubscribed ? (
                      <BellOff className="h-4 w-4 mr-2" />
                    ) : (
                      <Bell className="h-4 w-4 mr-2" />
                    )}
                    {isSubscribing ? '...' : isSubscribed ? 'Unwatch' : 'Watch'}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Owner actions */}
            {isOwner && (
              <>
                <DropdownMenuItem>
                  <Link href={`/g/${gist.id}/edit`} className="w-full flex items-center">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <AlertDialogTrigger asChild>
                    <div className="w-full flex items-center text-destructive">
                      <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                      Delete
                    </div>
                  </AlertDialogTrigger>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Common actions */}
            <DropdownMenuItem className="w-full flex items-center" onClick={copyEmbedScript}>
              <CodeIcon className="h-4 w-4 mr-2" />
              Embed
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/g/${gist.id}/download`} className="w-full flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {isOwner && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your gist
                {comments.length > 0 && ` and its ${comments.length} comment${comments.length !== 1 ? 's' : ''}`}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </>
  )
}

export function GistActionsWithDefault({ gist, comments }: GistActionsDropdownProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const isOwner = user && user.id === gist.owner.id;

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user || isOwner) {
        setIsCheckingSubscription(false);
        return;
      }

      try {
        const response = await fetch(`/api/subscriptions/gists/${gist.id}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setIsSubscribed(data.data.subscribed);
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
      } finally {
        setIsCheckingSubscription(false);
      }
    };

    checkSubscriptionStatus();
  }, [gist.id, user, isOwner]);

  const handleSubscribeToggle = async () => {
    if (!user) {
      router.push('/signin');
      return;
    }

    setIsSubscribing(true);

    try {
      const response = await fetch(`/api/subscriptions/gists/${gist.id}`, {
        method: isSubscribed ? 'DELETE' : 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setIsSubscribed(!isSubscribed);
        toast.success(
          isSubscribed
            ? 'Unsubscribed from gist notifications'
            : 'Subscribed to gist notifications'
        );
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update subscription');
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDelete = async () => {
    if (!gist) return;

    try {
      const result = await deleteGist(gist.id);

      if (result.success) {
        toast.success('Gist deleted successfully');
        router.push('/discover');
      } else {
        toast.error(result.error || 'Failed to delete gist');
      }
    } catch (error) {
      console.error('Error deleting gist:', error);
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <>
      <div className="hidden md:flex flex-row gap-2">
        {/* Subscribe button for non-owners */}
        {!isOwner && user && (
          <Button
            variant={isSubscribed ? "secondary" : "outline"}
            size="sm"
            onClick={handleSubscribeToggle}
            disabled={isSubscribing || isCheckingSubscription}
          >
            {isSubscribed ? (
              <BellOff className="h-4 w-4 mr-2" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            {isSubscribing ? '...' : isSubscribed ? 'Unwatch' : 'Watch'}
          </Button>
        )}

        {/* Owner actions */}
        {isOwner && (
          <>
            <Button
              variant="outline"
              size="sm"
            >
              <Link href={`/g/${gist.id}/edit`} className="w-full flex items-center">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive w-full sm:w-auto">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your gist
                    {comments.length > 0 && ` and its ${comments.length} comment${comments.length !== 1 ? 's' : ''}`}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </>
  )
}
