import { ImportGistPageClient } from '@/components/gist/import-gist-page-client';
import { generateMetadata as genMetadata } from '@/lib/metadata-utils';

export const metadata = genMetadata({
  title: 'Import Gist',
  description: 'Import a gist from GitHub or other sources',
  ogImagePath: '/api/og',
});

export default function ImportGistPage() {
  return <ImportGistPageClient />;
}
