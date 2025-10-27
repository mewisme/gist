'use client';

import { formatDistanceToNow } from 'date-fns';
import { FileCode, GitFork, MessageCircle, Star } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import type { File, Gist, User } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

import { Code, CodeBlock } from '../animate-ui/components/animate/code';

interface GistUserCardProps {
  gist: Gist & { owner: User; files?: File[]; commentCount: number };
}

export function GistUserCard({ gist }: GistUserCardProps) {
  const primaryFile = gist.files?.[0];
  const fileExtension = primaryFile?.filename?.split('.').pop()?.toLowerCase() || 'txt';
  const isMarkdown = fileExtension === 'md' || fileExtension === 'markdown';

  const preview = primaryFile?.content?.substring(0, 400) || '';
  const displayPreview = isMarkdown && preview
    ? preview.split('\n')[0]?.substring(0, 100) || preview.substring(0, 100)
    : preview;

  return (
    <Card className="hover:shadow-lg transition-shadow border-border/40">
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex items-center gap-1">
                <Link
                  href={`/g/${gist.id}`}
                  className="text-sm font-medium text-primary hover:underline truncate block"
                >
                  <span className='text-blue-400'>{primaryFile?.filename || 'untitled'}</span>
                </Link>
              </div>
            </div>

            <div className="text-xs text-muted-foreground ml-0 mb-0.5">
              Created {formatDistanceToNow(new Date(gist.createdAt), { addSuffix: true })}
            </div>

            {(gist.description) && (
              <div className="text-xs text-muted-foreground ml-0 line-clamp-1">
                {gist.description}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
            <div className="flex items-center gap-1">
              <FileCode className="h-3.5 w-3.5" />
              <span>{gist.fileCount} file{gist.fileCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitFork className="h-3.5 w-3.5" />
              <span>{gist.forkCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>{gist.commentCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5" />
              <span>{gist.starCount}</span>
            </div>
          </div>
        </div>

        {displayPreview && (
          <div className="mt-4 ">
            <div
              className={cn(
                isMarkdown && "text-base font-bold text-foreground line-clamp-2"
              )}
            >
              {isMarkdown ? (
                <div>{displayPreview}</div>
              ) : (
                <Code code={displayPreview}>
                  <CodeBlock lang={gist.files?.[0].language || 'text'} />
                </Code>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
