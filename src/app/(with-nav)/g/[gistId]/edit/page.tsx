import { Metadata } from 'next';

import { EditGistPageClient } from '@/components/gist/edit-gist-page-client';
import { generateMetadata as genMetadata } from '@/lib/metadata-utils';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gistId: string }>;
}): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/gists/${resolvedParams.gistId}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      return genMetadata({
        title: 'Edit Gist',
        description: 'Edit your code snippet',
        ogImagePath: '/api/og',
      });
    }

    const data = await response.json();
    const gist = data.gist;

    const title = gist.title || gist.files?.at(0)?.filename || gist.description || 'Untitled Gist';

    return genMetadata({
      title: `Edit ${title}`,
      description: `Edit your gist: ${gist.description || 'Update your code snippets'}`,
      ogImagePath: `/api/og/gist/${resolvedParams.gistId}`,
    });
  } catch (error) {
    return genMetadata({
      title: 'Edit Gist',
      description: 'Edit your code snippet',
      ogImagePath: '/api/og',
    });
  }
}

export default async function EditGistPage({
  params,
}: {
  params: Promise<{ gistId: string }>;
}) {
  const resolvedParams = await params;
  return <EditGistPageClient gistId={resolvedParams.gistId} />;
}