import { generateOGImage } from '@/lib/og-utils';

export const runtime = 'nodejs';

export async function GET() {
  return generateOGImage({
    title: 'Gist - Share Code Snippets',
    description: 'Create, share, and discover code snippets with syntax highlighting, versioning, and collaboration features.',
    type: 'default',
  });
}

