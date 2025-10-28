import { HomePageClient } from '@/components/screens/home-page-client';
import { generateMetadata as genMetadata } from '@/lib/metadata-utils';

export const metadata = genMetadata({
  title: 'Create Code Snippets',
  description: 'Create, share, and discover code snippets with syntax highlighting, versioning, and collaboration features.',
  keywords: ['code snippets', 'gist', 'programming', 'syntax highlighting', 'code sharing', 'collaboration'],
  ogImagePath: '/api/og',
});

export default function Home() {
  return <HomePageClient />;
}