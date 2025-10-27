'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/components/auth/auth-context';
import { NewGistPageClient } from '@/components/gist/new-gist-page-client';
import { Skeleton } from '@/components/ui/skeleton';

export function HomePageClient() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/discover');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-8 w-48" />

        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-8 w-24" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 w-full rounded-lg" />
          ))}
        </div>

        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <NewGistPageClient />;
}
