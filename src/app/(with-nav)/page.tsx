import { Metadata } from 'next';

import { HomePageClient } from '@/components/screens/home-page-client';

export const metadata: Metadata = {
  title: 'Gist - Create Code Snippets',
  description: 'Create, share, and discover code snippets with syntax highlighting, versioning, and collaboration features.',
  keywords: ['code snippets', 'gist', 'programming', 'syntax highlighting', 'code sharing', 'collaboration'],
  openGraph: {
    title: 'Gist - Create Code Snippets',
    description: 'Create, share, and discover code snippets with syntax highlighting, versioning, and collaboration features.',
    type: 'website',
    siteName: 'Gist',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gist - Create Code Snippets',
    description: 'Create, share, and discover code snippets with syntax highlighting, versioning, and collaboration features.',
  },
};

export default function Home() {
  return <HomePageClient />;
}