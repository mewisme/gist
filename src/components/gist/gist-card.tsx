'use client';

import { formatDistanceToNow } from 'date-fns';
import { Eye, GitFork, MessageCircle, Star } from 'lucide-react';
import Link from 'next/link';

import { Code, CodeBlock } from '@/components/animate-ui/components/animate/code';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { File, Gist, User } from '@/lib/db/schema';
import { detectLanguage, getLanguageDisplayName } from '@/lib/utils/language-detection';

interface GistCardProps {
  gist: Gist & { owner: User; files?: File[]; commentCount: number; forkData?: Gist & { owner: User } };
  showOwner?: boolean;
}

export function GistCard({ gist, showOwner = true }: GistCardProps) {
  const primaryFile = gist.files?.[0];
  const language = detectLanguage(primaryFile?.filename || 'text');
  const preview = primaryFile?.content?.substring(0, 200) || '';

  return (
    <Card className="hover:shadow-md transition-shadow py-3">
      <CardHeader className="">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Link
              href={`/g/${gist.id}`}
              className="block group"
            >
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                {gist.title || gist.description || 'Untitled Gist'}
              </h3>
            </Link>

            {showOwner && (
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={gist.owner.photoUrl || undefined} alt={gist.owner.displayName} />
                  <AvatarFallback className="text-xs">
                    {gist.owner.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Link
                  href={`/u/${gist.owner.handle}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {gist.owner.displayName}
                </Link>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(gist.createdAt), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 ml-4">
            <Badge variant="secondary" className="text-xs">
              {getLanguageDisplayName(language)}
            </Badge>
            {gist.visibility !== 'public' && (
              <Badge variant="outline" className="text-xs">
                {gist.visibility}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {gist.tags && gist.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {gist.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {preview && (
          <div className="mb-4">
            <Code code={preview + (primaryFile?.content && primaryFile.content.length > 200 ? '...' : '')}>
              <CodeBlock
                lang={language}
                writing={false}
                className="max-h-32 text-xs"
              />
            </Code>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">{gist.fileCount} file{gist.fileCount !== 1 ? 's' : ''}</span>
              <span className="sm:hidden">{gist.fileCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 md:h-4 md:w-4" />
              <span>{gist.starCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitFork className="h-3 w-3 md:h-4 md:w-4" />
              <span>{gist.forkCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3 md:h-4 md:w-4" />
              <span>{gist.commentCount}</span>
            </div>
          </div>

          <Button asChild variant="ghost" size="sm" className="text-xs md:text-sm">
            <Link href={`/g/${gist.id}`}>
              View
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
