'use client';

import { formatDistanceToNow } from 'date-fns';
import { Calendar, Code, Download, Eye, GitFork } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '@/components/auth/auth-context';
import { ClientCodeBlock } from '@/components/gist/client-code-block';
import { CommentForm } from '@/components/gist/comment-form';
import { CommentList } from '@/components/gist/comment-list';
import { ForkButton } from '@/components/gist/fork-button';
import { GistActionsWithDefault, GistActionsWithDropdown } from '@/components/gist/gist-actions-dropdown';
import { StarButton } from '@/components/gist/star-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Comment, File, Gist, User } from '@/lib/db';

interface GistPageClientProps {
  gistId: string;
}

export function GistPageClient({ gistId }: GistPageClientProps) {
  const { user } = useAuth();
  const [gist, setGist] = useState<Gist & { owner: User, files: File[], forkData?: Gist & { owner: User } } | null>(null);
  const [comments, setComments] = useState<(Comment & { author: User })[]>([]);
  const [loading, setLoading] = useState(true);

  const copyEmbedScript = async () => {
    const embedScript = `<iframe src="${window.location.origin}/e/${gistId}" width="100%" height="400" frameborder="0"></iframe>`;
    try {
      await navigator.clipboard.writeText(embedScript);
      toast.success('Embed script copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy embed script:', error);
      toast.error('Failed to copy embed script');
    }
  };

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
      setComments(data.comments);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching gist data:', error);
      notFound();
    }
  };

  useEffect(() => {
    fetchGistData();
  }, [gistId]);

  const handleCommentAdded = () => {
    fetchGistData();
  };

  const handleCommentDeleted = () => {
    fetchGistData();
  };

  const handleStarCountChange = (newCount: number) => {
    setGist((prev: any) => prev ? { ...prev, starCount: newCount } : null);
  };

  const handleForkCountChange = (newCount: number) => {
    setGist((prev: any) => prev ? { ...prev, forkCount: newCount } : null);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">

        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Skeleton className="h-8 w-3/4 mb-2" />
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex gap-2 mb-4">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>

        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="w-full border rounded-lg">
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
          ))}
        </div>

        <div className="mt-12 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Skeleton className="h-96 rounded-lg" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-8 w-32 mb-6" />
              <div className="space-y-4">
                <Skeleton className="h-32 rounded-lg" />
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!gist) {
    notFound();
  }

  return (
    <>
      <div className="mb-6 md:mb-8 max-w-4xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4 gap-4">
          <div className="flex-1">
            <div className="flex flex-row items-center justify-between">

              <h1 className="text-2xl md:text-3xl font-bold mb-2 flex flex-row gap-2">
                <span>
                  {gist.title || gist.description || 'Untitled Gist'}
                </span>
                <Badge variant={'outline'} className='text-sm md:text-md capitalize my-1'>
                  {gist.visibility}
                </Badge>
              </h1>

              <GistActionsWithDropdown gist={gist} comments={comments} />
            </div>


            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={gist.owner.photoUrl || undefined} alt={gist.owner.displayName} />
                  <AvatarFallback className="text-xs">
                    {gist.owner.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Link
                  href={`/u/${gist.owner.handle}`}
                  className="hover:text-foreground transition-colors"
                >
                  {gist.owner.displayName}
                </Link>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDistanceToNow(new Date(gist.createdAt), { addSuffix: true })}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{gist.fileCount} file{gist.fileCount !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {gist.forkData && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GitFork className="h-4 w-4" />
                <span>Forked from</span>
                <Link
                  href={`/g/${gist.forkData.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {gist.forkData.title || gist.forkData.description || 'Untitled Gist'}
                </Link>
                <span>by</span>
                <Link
                  href={`/u/${gist.forkData.owner.handle}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {gist.forkData.owner.displayName}
                </Link>
              </div>
            )}

            {gist.tags && gist.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {gist.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <GistActionsWithDefault gist={gist} comments={comments} />
        </div>

        <div className="flex flex-row gap-3 sm:gap-4">
          <StarButton
            gistId={gist.id}
            initialStarCount={gist.starCount}
            onStarCountChange={handleStarCountChange}
          />
          <ForkButton
            gistId={gist.id}
            forkCount={gist.forkCount}
            ownerId={gist.owner.id}
            onForkCountChange={handleForkCountChange}
          />
          <Button variant="outline" size="sm" className="hidden md:block">
            <Link href={`/g/${gist.id}/download`} className='flex items-center flex-row gap-4'>
              <Download className="h-4 w-4" />
              Download
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="hidden md:flex items-center flex-row gap-4" onClick={copyEmbedScript}>
            <Code className="h-4 w-4" />
            Embed
          </Button>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
        {gist.files.map((file: any) => (
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
            <ClientCodeBlock file={file} gistId={gist.id} />
          </Suspense>
        ))}
      </div>

      <div id="revision-history" className="mt-8 md:mt-12 max-w-4xl mx-auto">
        <div className="lg:col-span-2">
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Comments</h2>

          {user && (
            <div className="mb-6 md:mb-8">
              <CommentForm gistId={gist.id} onCommentAdded={handleCommentAdded} />
            </div>
          )}

          <CommentList comments={comments} onCommentDeleted={handleCommentDeleted} />
        </div>
      </div>
    </>
  );
}
