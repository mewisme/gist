'use client';

import { formatDistanceToNow } from 'date-fns';
import { Clock, Eye, FileText, GitCommit } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

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
}

interface RevisionHistoryProps {
  gistId: string;
  currentDescription?: string;
  currentFileCount: number;
  currentCreatedAt: Date;
}

export function RevisionHistory({
  gistId,
  currentDescription,
  currentFileCount,
  currentCreatedAt
}: RevisionHistoryProps) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRevisions = async () => {
      try {
        const response = await fetch(`/api/gists/${gistId}/revisions`);
        if (!response.ok) {
          throw new Error('Failed to fetch revisions');
        }
        const data = await response.json();
        setRevisions(data.revisions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load revisions');
      } finally {
        setLoading(false);
      }
    };

    fetchRevisions();
  }, [gistId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCommit className="h-5 w-5" />
            Revision History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-3 h-3 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCommit className="h-5 w-5" />
            Revision History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasRevisions = revisions.length > 0;

  const allRevisions = hasRevisions ? [
    {
      id: 'current',
      gistId,
      snapshotMeta: {
        description: currentDescription,
        fileCount: currentFileCount,
      },
      createdAt: currentCreatedAt,
      isCurrent: true,
    },
    ...revisions.map(rev => ({ ...rev, isCurrent: false }))
  ] : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCommit className="h-5 w-5" />
          Revision History
          <Badge variant="secondary">{allRevisions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasRevisions ? (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {allRevisions.map((revision, index) => (
                <div key={revision.id}>
                  <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${revision.isCurrent
                        ? 'bg-primary border-2 border-primary-foreground'
                        : 'bg-muted-foreground'
                        }`} />
                      {index < allRevisions.length - 1 && (
                        <div className="w-px h-8 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {revision.isCurrent ? 'Current Version' : `Revision ${revisions.length - index}`}
                        </span>
                        {revision.isCurrent && (
                          <Badge variant="default" className="text-xs">Latest</Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {revision.snapshotMeta.description || 'No description'}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{revision.snapshotMeta.fileCount} file{revision.snapshotMeta.fileCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDistanceToNow(new Date(revision.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>

                      {revision.snapshotMeta.tags && revision.snapshotMeta.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {revision.snapshotMeta.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={revision.isCurrent ? `/g/${gistId}` : `/g/${gistId}/revisions/${revision.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <GitCommit className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No revisions yet</p>
            <p className="text-sm text-muted-foreground">
              Revisions will appear here when you update this gist
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
