import { Metadata } from 'next';

import { EditGistPageClient } from '@/components/gist/edit-gist-page-client';

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
      return {
        title: 'Edit Gist - Gist',
      };
    }

    const data = await response.json();
    const gist = data.gist;

    const title = gist.title || gist.files?.at(0)?.filename || gist.description || 'Untitled Gist';

    return {
      title: `Edit ${title} - Gist`,
      description: `Edit your gist: ${gist.description || 'Update your code snippets'}`,
    };
  } catch (error) {
    return {
      title: 'Edit Gist - Gist',
    };
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