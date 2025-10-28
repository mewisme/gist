import { Metadata } from 'next';

import { GistRevisionPageClient } from '@/components/gist/gist-revision-page-client';
import { generateMetadata as genMetadata } from '@/lib/metadata-utils';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gistId: string; revisionId: string }>;
}): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/gists/${resolvedParams.gistId}/revisions/${resolvedParams.revisionId}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      return genMetadata({
        title: 'Gist Revision',
        description: 'View historical revision',
        ogImagePath: '/api/og',
      });
    }

    const data = await response.json();
    const revision = data.revision;

    const title = revision.snapshotMeta.description || 'Untitled Gist';

    return genMetadata({
      title: `Revision: ${title}`,
      description: `Historical revision of ${title}`,
      ogImagePath: `/api/og/gist/${resolvedParams.gistId}`,
    });
  } catch (error) {
    return genMetadata({
      title: 'Gist Revision',
      description: 'View historical revision',
      ogImagePath: '/api/og',
    });
  }
}

export default async function RevisionPage({
  params,
}: {
  params: Promise<{ gistId: string; revisionId: string }>;
}) {
  const resolvedParams = await params;
  return <GistRevisionPageClient gistId={resolvedParams.gistId} revisionId={resolvedParams.revisionId} />;
}