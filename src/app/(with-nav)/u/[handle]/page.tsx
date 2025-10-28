import { formatDistanceToNow } from 'date-fns';
import { eq } from 'drizzle-orm';
import { Calendar, Code, GitFork, Star } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { GistUserCard } from '@/components/gist/gist-user-card';
import { SubscribeToUserButton } from '@/components/gist/subscribe-to-user-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserSortDropdown } from '@/components/user/user-sort-dropdown';
import { db, users } from '@/lib/db';
import { generateMetadata as genMetadata } from '@/lib/metadata-utils';
import { GistRepository } from '@/lib/repositories/gist-repository';

const gistRepository = new GistRepository();

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  try {
    const { handle } = await params;

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.handle, handle))
      .limit(1);

    if (userResult.length === 0) {
      return genMetadata({
        title: 'User Not Found',
        description: 'The requested user could not be found.',
        ogImagePath: '/api/og',
      });
    }

    const user = userResult[0];
    const result = await gistRepository.getGistsByUser(user.id, 1, 0, 'recently-created');

    return genMetadata({
      title: user.displayName,
      description: `@${user.handle} • ${result.total} gist${result.total !== 1 ? 's' : ''}`,
      ogImagePath: `/api/og/user/${handle}`,
    });
  } catch (error) {
    return genMetadata({
      title: 'User Not Found',
      description: 'The requested user could not be found.',
      ogImagePath: '/api/og',
    });
  }
}

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const { handle } = await params;
  const searchParamsData = await searchParams;

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.handle, handle))
    .limit(1);

  if (userResult.length === 0) {
    notFound();
  }

  const user = userResult[0];

  const validSortOptions = ['recently-created', 'recently-updated', 'least-recently-created', 'least-recently-updated'];
  const sortBy = searchParamsData.sort && validSortOptions.includes(searchParamsData.sort)
    ? searchParamsData.sort as 'recently-created' | 'recently-updated' | 'least-recently-created' | 'least-recently-updated'
    : 'recently-created';

  const page = parseInt(searchParamsData.page || '1', 10);
  const itemsPerPage = 10;
  const offset = (page - 1) * itemsPerPage;

  const result = await gistRepository.getGistsByUser(user.id, itemsPerPage, offset, sortBy);
  const { gists, total } = result;
  const totalPages = Math.ceil(total / itemsPerPage);

  // Get all gists for stats (only if total is reasonable to avoid loading too many)
  let publicCount = 0;
  let secretCount = 0;
  let totalStars = 0;
  let totalForks = 0;

  if (total <= 1000) {
    const allGistsResult = await gistRepository.getGistsByUser(user.id, total, 0, sortBy);
    const publicGists = allGistsResult.gists.filter(gist => gist.visibility === 'public');
    const secretGists = allGistsResult.gists.filter(gist => gist.visibility === 'secret');
    publicCount = publicGists.length;
    secretCount = secretGists.length;
    totalStars = allGistsResult.gists.reduce((sum, gist) => sum + gist.starCount, 0);
    totalForks = allGistsResult.gists.reduce((sum, gist) => sum + gist.forkCount, 0);
  }

  return (
    <div className="max-w-6xl mx-auto">

      <Card className="mb-6 md:mb-8">
        <CardContent className="pt-4 md:pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.photoUrl || undefined} alt={user.displayName} />
              <AvatarFallback className="text-2xl">
                {user.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">{user.displayName}</h1>
                <SubscribeToUserButton userId={user.id} userName={user.displayName} />
              </div>
              <p className="text-lg md:text-xl text-muted-foreground mb-4">@{user.handle}</p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1 justify-center sm:justify-start">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1 justify-center sm:justify-start">
                  <Code className="h-4 w-4" />
                  <span>{total} gist{total !== 1 ? 's' : ''} {total <= 1000 && `(${publicCount} public, ${secretCount} secret)`}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1 justify-center sm:justify-start">
                  <Star className="h-4 w-4" />
                  <span>{totalStars}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1 justify-center sm:justify-start">
                  <GitFork className="h-4 w-4" />
                  <span>{totalForks}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-3 sm:gap-0">
          <h2 className="text-xl md:text-2xl font-bold">All Gists</h2>
          <UserSortDropdown defaultValue={sortBy} handle={handle} />
        </div>

        {gists.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Code className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No gists yet</h3>
            <p className="text-muted-foreground">
              This user hasn't created any gists.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:gap-6 grid-cols-1 max-w-4xl mx-auto">
              {gists.map((gist) => (
                <GistUserCard key={gist.id} gist={gist} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6 md:mt-8">
                <Button
                  asChild
                  variant="outline"
                  disabled={page === 1}
                  className={page === 1 ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <Link
                    href={`/u/${handle}?page=${page - 1}${searchParamsData.sort ? `&sort=${searchParamsData.sort}` : ''}`}
                  >
                    Older
                  </Link>
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>

                <Button
                  asChild
                  variant="outline"
                  disabled={page >= totalPages}
                  className={page >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <Link
                    href={`/u/${handle}?page=${page + 1}${searchParamsData.sort ? `&sort=${searchParamsData.sort}` : ''}`}
                  >
                    Newer
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
