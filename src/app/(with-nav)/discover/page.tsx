import { Code } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

import { SortDropdown } from '@/components/discover/sort-dropdown';
import { GistDiscoverCard } from '@/components/gist/gist-discover-card';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth';
import { generateMetadata as genMetadata } from '@/lib/metadata-utils';
import { GistRepository } from '@/lib/repositories/gist-repository';

const gistRepository = new GistRepository();

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; sort?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;

  if (params.search) {
    return genMetadata({
      title: `Search Results for "${params.search}"`,
      description: `Search results for "${params.search}" on Gist. Find and discover code snippets, gists, and programming examples.`,
      ogImagePath: '/api/og',
    });
  }

  return genMetadata({
    title: 'Discover Gists',
    description: 'Discover and explore code snippets, gists, and programming examples shared by the community.',
    keywords: ['code snippets', 'gist', 'programming', 'syntax highlighting', 'code sharing', 'discover'],
    ogImagePath: '/api/og',
  });
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  let gists;

  const validSortOptions = ['recently-created', 'recently-updated', 'least-recently-created', 'least-recently-updated'];
  const sortBy = params.sort && validSortOptions.includes(params.sort)
    ? params.sort as 'recently-created' | 'recently-updated' | 'least-recently-created' | 'least-recently-updated'
    : 'recently-created';

  if (params.search) {
    gists = await gistRepository.searchGists(params.search, 20, 0, user?.id);
  } else {
    gists = await gistRepository.getPublicGists(20, 0, sortBy);
  }

  return (
    <>
      {!params.search ? (
        <>
          <div className="text-center py-8 md:py-16">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Instantly share code, notes, and snippets.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto px-4">
              Discover and explore code snippets with syntax highlighting,
              versioning, and collaboration features.
            </p>
          </div>
        </>
      ) : (
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold mb-2">
            Search Results for "{params.search}"
          </h1>
          <p className="text-muted-foreground">
            {gists.length} gist{gists.length !== 1 ? 's' : ''} found
          </p>
        </div>
      )}

      <section id="recent" className="py-6 md:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-3 sm:gap-0">
          <h2 className="text-xl md:text-2xl font-bold">
            {params.search ? 'Search Results' : 'Recent Public Gists'}
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {!params.search && (
              <SortDropdown defaultValue={sortBy} />
            )}
          </div>
        </div>

        {gists.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Code className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {params.search ? 'No gists found' : 'No gists yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {params.search
                ? 'Try a different search term or create a new gist.'
                : 'Be the first to create a public gist!'
              }
            </p>
            <Button asChild>
              <Link href="/signin">Sign In to Create Your First Gist</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6 grid-cols-1 max-w-4xl mx-auto">
            {gists.map((gist) => (
              <GistDiscoverCard key={gist.id} gist={gist} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
