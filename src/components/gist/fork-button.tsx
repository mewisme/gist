'use client';

import { GitFork } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-context';
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

import { Badge } from '../ui/badge';

interface ForkButtonProps {
  gistId: string;
  forkCount: number;
  ownerId: string;
  onForkCountChange?: (newCount: number) => void;
}

export function ForkButton({ gistId, forkCount, ownerId, onForkCountChange }: ForkButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isForking, setIsForking] = useState(false);

  const handleFork = async () => {
    if (!user) return;

    setIsForking(true);

    try {
      const response = await fetch(`/api/gists/${gistId}/fork`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        onForkCountChange?.(forkCount + 1);

        router.push(`/g/${data.data.forkedGist.id}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to fork gist:', errorData.error);
        alert(errorData.error || 'Failed to fork gist');
      }
    } catch (error) {
      console.error('Error forking gist:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsForking(false);
    }
  };

  if (!user) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/signin">
          <GitFork className="h-4 w-4 mr-2" />
          Fork <Badge variant={'secondary'}>{forkCount}</Badge>
        </Link>
      </Button>
    );
  }

  if (user.id === ownerId) {
    return (
      <Button variant="outline" size="sm" disabled>
        <GitFork className="h-4 w-4 mr-2" />
        Fork <Badge variant={'secondary'}>{forkCount}</Badge>
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isForking}>
          <GitFork className="h-4 w-4 mr-2" />
          {isForking ? 'Forking...' : `Fork `} <Badge variant={'secondary'}>{forkCount}</Badge>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Fork Gist</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to fork this gist? This will create a copy of the gist in your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleFork} disabled={isForking}>
            {isForking ? 'Forking...' : 'Fork Gist'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
