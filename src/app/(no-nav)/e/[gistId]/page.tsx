import { EmbedGistClient } from '@/components/gist/embed-gist-client';

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
      return {
        title: 'Gist Not Found',
      };
    }

    const data = await response.json();
    const gist = data.gist;

    const title = gist.title || gist.description || gist.files?.at(0)?.filename || 'Untitled Gist';
    const description = gist.description || `A ${gist.visibility} gist by ${gist.owner.displayName}`;

    return {
      title: `${title} - Embed - Gist`,
      description: description,
      openGraph: {
        title: `${title} - Embed`,
        description: description,
        type: 'article',
        authors: [gist.owner.displayName],
      },
    };
  } catch (error) {
    return {
      title: 'Gist Not Found',
    };
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
