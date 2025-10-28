import { NextRequest } from 'next/server';

import { generateOGImage } from '@/lib/og-utils';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gistId: string }> }
) {
  const { gistId } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/gists/${gistId}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return generateOGImage({
        title: 'Gist Not Found',
        description: 'The requested gist could not be found.',
        type: 'gist',
      });
    }

    const data = await response.json();
    const gist = data.gist;

    const title =
      gist.title ||
      gist.files?.at(0)?.filename ||
      gist.description ||
      'Untitled Gist';
    const description =
      gist.description || `A ${gist.visibility} gist by ${gist.owner.displayName}`;

    // Get language tags from files
    const tags = gist.files
      ?.map((file: any) => file.language)
      .filter((lang: string) => lang && lang !== 'text')
      .slice(0, 4) || [];

    return generateOGImage({
      title,
      description,
      author: gist.owner.displayName,
      authorAvatar: gist.owner.photoUrl,
      tags: tags.length > 0 ? tags : undefined,
      type: 'gist',
    });
  } catch (error) {
    return generateOGImage({
      title: 'Gist Not Found',
      description: 'The requested gist could not be found.',
      type: 'gist',
    });
  }
}

