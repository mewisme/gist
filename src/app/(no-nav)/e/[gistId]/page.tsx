import { EmbedGistClient } from '@/components/gist/embed-gist-client';
import { generateMetadata as genMetadata } from '@/lib/metadata-utils';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gistId: string }>;
}) {
  try {
    const resolvedParams = await params;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/gists/${resolvedParams.gistId}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      return genMetadata({
        title: 'Gist Not Found - Embed',
        description: 'The requested gist could not be found.',
        ogImagePath: '/api/og',
      });
    }

    const data = await response.json();
    const gist = data.gist;

    const title = gist.title || gist.description || gist.files?.at(0)?.filename || 'Untitled Gist';
    const description = gist.description || `A ${gist.visibility} gist by ${gist.owner.displayName}`;

    return genMetadata({
      title: `${title} - Embed`,
      description,
      type: 'article',
      authors: [gist.owner.displayName],
      ogImagePath: `/api/og/gist/${resolvedParams.gistId}`,
    });
  } catch (error) {
    return genMetadata({
      title: 'Gist Not Found - Embed',
      description: 'The requested gist could not be found.',
      ogImagePath: '/api/og',
    });
  }
}

export default async function EmbedGistPage({
  params,
}: {
  params: Promise<{ gistId: string }>;
}) {
  const resolvedParams = await params;

  return <EmbedGistClient gistId={resolvedParams.gistId} />;
}
