import { Metadata } from 'next';

import { NotFoundPageClient } from '@/components/screens/not-found-page-client';

export const metadata: Metadata = {
  title: 'Page Not Found - Gist',
  description: 'The page you are looking for does not exist',
};

export default function NotFound() {
  return <NotFoundPageClient />;
}
