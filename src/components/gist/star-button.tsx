'use client';

import { Star } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface StarButtonProps {
  gistId: string;
  initialStarCount: number;
  onStarCountChange?: (newCount: number) => void;
}

export function StarButton({ gistId, initialStarCount, onStarCountChange }: StarButtonProps) {
  const { user } = useAuth();
  const [starCount, setStarCount] = useState(initialStarCount);
  const [isStarred, setIsStarred] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  useEffect(() => {
    const checkStarStatus = async () => {
      if (!user) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        const response = await fetch(`/api/gists/${gistId}/star`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setIsStarred(data.data.starred);
        }
      } catch (error) {
        console.error('Error checking star status:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkStarStatus();
  }, [gistId, user]);

  const handleStarToggle = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/gists/${gistId}/star`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setIsStarred(data.data.starred);
        setStarCount(data.data.starCount);
        onStarCountChange?.(data.data.starCount);
      } else {
        console.error('Failed to toggle star');
      }
    } catch (error) {
      console.error('Error toggling star:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/signin">
          <Star className="h-4 w-4 mr-2" />
          Star <Badge variant={'secondary'}>{starCount}</Badge>
        </Link>
      </Button>
    );
  }

  if (isCheckingStatus) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Star className="h-4 w-4 mr-2" />
        Star <Badge variant={'secondary'}>{starCount}</Badge>
      </Button>
    );
  }

  return (
    <Button
      variant={"outline"}
      size="sm"
      onClick={handleStarToggle}
      disabled={isLoading}
    >
      <Star className={`h-4 w-4 mr-2 ${isStarred ? 'fill-yellow-500' : ''}`} />
      {isLoading ? '...' : `${isStarred ? 'Unstar' : 'Star'} `} <Badge variant={'secondary'}>{starCount}</Badge>
    </Button>
  );
}
