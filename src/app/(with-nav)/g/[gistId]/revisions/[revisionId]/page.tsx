import { Metadata } from 'next';

import { GistRevisionPageClient } from '@/components/gist/gist-revision-page-client';

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
      return {
        title: 'Gist Revision - Gist',
      };
    }

    const data = await response.json();
    const revision = data.revision;

    const title = revision.snapshotMeta.description || 'Untitled Gist';

    return {
      title: `Revision: ${title} - Gist`,
      description: `Historical revision of ${title}`,
    };
  } catch (error) {
    return {
      title: 'Gist Revision - Gist',
    };
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