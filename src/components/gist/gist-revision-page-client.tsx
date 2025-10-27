'use client';

import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Calendar, FileText, GitCommit, Tag } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense,useEffect, useState  } from 'react';

import { ClientCodeBlock } from '@/components/gist/client-code-block';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface RevisionFile {
  id: string;
  filename: string;
  language: string;
  content: string;
  size: number;
}

interface Revision {
  id: string;
  gistId: string;
  parentRevId?: string;
  snapshotMeta: {
    description?: string;
    tags?: string[];
    fileCount: number;
  };
  createdAt: Date;
  files: RevisionFile[];
}

interface Gist {
  id: string;
  ownerId: string;
  description?: string;
  visibility: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  fileCount: number;
  starCount: number;
  forkCount: number;
  owner: {
    id: string;
    handle: string;
    displayName: string;
    photoUrl?: string;
  };
}

interface GistRevisionPageClientProps {
  gistId: string;
  revisionId: string;
}

export function GistRevisionPageClient({ gistId, revisionId }: GistRevisionPageClientProps) {
  const [revision, setRevision] = useState<Revision | null>(null);
  const [gist, setGist] = useState<Gist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevisionData = async () => {
      try {
        const response = await fetch(`/api/gists/${gistId}/revisions/${revisionId}`);

        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error('Failed to fetch revision');
        }

        const data = await response.json();
        setRevision(data.revision);
        setGist(data.gist);
      } catch (error) {
        console.error('Error fetching revision data:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchRevisionData();
  }, [gistId, revisionId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="h-8 bg-muted animate-pulse rounded w-1/3 mb-4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!revision || !gist) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
            <Button asChild variant="ghost" size="sm" className="w-full sm:w-auto">
              <Link href={`/g/${gist.id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Current Version
              </Link>
            </Button>
            <Badge variant="outline" className="flex items-center gap-1 w-fit">
              <GitCommit className="h-3 w-3" />
              Historical Revision
            </Badge>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {revision.snapshotMeta.description || 'Untitled Gist'}
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={gist.owner.photoUrl || undefined} alt={gist.owner.displayName} />
                <AvatarFallback className="text-xs">
                  {gist.owner.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Link
                href={`/u/${gist.owner.handle}`}
                className="text-sm hover:text-foreground transition-colors"
              >
                {gist.owner.displayName}
              </Link>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="h-4 w-4" />
              <span>{formatDistanceToNow(new Date(revision.createdAt), { addSuffix: true })}</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1 text-sm">
              <FileText className="h-4 w-4" />
              <span>{revision.snapshotMeta.fileCount} file{revision.snapshotMeta.fileCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {revision.snapshotMeta.tags && revision.snapshotMeta.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {revision.snapshotMeta.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Card className="mb-6 md:mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-lg font-semibold">Revision Details</h2>
              <Badge variant="outline">Revision {revision.id.slice(0, 8)}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Created:</span>
                <p className="text-muted-foreground">
                  {new Date(revision.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="font-medium">Files:</span>
                <p className="text-muted-foreground">
                  {revision.snapshotMeta.fileCount} file{revision.snapshotMeta.fileCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <span className="font-medium">Parent:</span>
                <p className="text-muted-foreground">
                  {revision.parentRevId ? revision.parentRevId.slice(0, 8) : 'Initial revision'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 md:space-y-6">
          <h2 className="text-xl md:text-2xl font-bold">Files</h2>
          {revision.files.map((file) => (
            <Suspense key={file.id} fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
              <ClientCodeBlock
                file={{
                  id: file.id,
                  filename: file.filename,
                  language: file.language,
                  content: file.content,
                  size: file.size,
                }}
                gistId={gist.id}
              />
            </Suspense>
          ))}
        </div>

        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={`/g/${gist.id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                View Current Version
              </Link>
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/g/${gist.id}`}>
                <GitCommit className="h-4 w-4 mr-2" />
                View All Revisions
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
