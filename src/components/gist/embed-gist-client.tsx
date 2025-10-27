'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Suspense, useEffect, useState } from 'react';

import { File, Gist, User as UserType } from '@/lib/db';

import { Skeleton } from '../ui/skeleton';
import { ClientCodeBlock } from './client-code-block';

interface EmbedGistClientProps {
  gistId: string;
}

export function EmbedGistClient({ gistId }: EmbedGistClientProps) {
  const [gist, setGist] = useState<Gist & { owner: UserType, files: File[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const { resolvedTheme } = useTheme();

  const fetchGistData = async () => {
    try {
      const response = await fetch(`/api/gists/${gistId}`);

      if (!response.ok) {
        if (response.status === 404) {
          notFound();
        }
        throw new Error('Failed to fetch gist');
      }

      const data = await response.json();
      setGist(data.gist);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching gist data:', error);
      notFound();
    }
  };

  useEffect(() => {
    fetchGistData();
  }, [gistId]);

  if (loading) {
    return (
      <div className="bg-background">
        <div className="w-full">
          <div className="animate-pulse">
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!gist) {
    notFound();
  }

  return (
    <div className="bg-background">
      <div className="w-full">
        <div className="space-y-4">
          {gist.files.map((file: any) => (
            <Suspense
              key={file.id}
              fallback={
                <div className="w-full border rounded-lg">
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                      <div className="h-5 w-16 bg-muted rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="h-96 w-full bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
              }
            >
              <EmbedCodeBlock gistId={gistId} file={file} resolvedTheme={resolvedTheme} />
            </Suspense>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmbedCodeBlock({ gistId, file, resolvedTheme }: { gistId: string, file: any, resolvedTheme: string | undefined }) {
  return (
    <div className="w-full">
      <Suspense
        key={file.id}
        fallback={
          <div className="w-full border rounded-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-8 w-12" />
              </div>
            </div>
            <div className="p-4">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        }
      >
        <ClientCodeBlock file={file} header={
          <>
            <span className="font-medium text-sm sm:text-base">{file.filename}</span>
            <span>
              hosted with ❤ by <Link href="https://gist.mewis.me" target="_blank">Gist</Link>
            </span>
          </>
        } gistId={gistId} />
      </Suspense>
    </div>
  );
}
