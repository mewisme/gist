import { inArray } from 'drizzle-orm';
import type { MetadataRoute } from 'next';

import { db, users } from '@/lib/db';
import { GistRepository } from '@/lib/repositories/gist-repository';

const gistRepository = new GistRepository();

export const dynamic = 'force-dynamic';

export const revalidate = false;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string): string =>
    new URL(path, `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}`).toString();

  const publicGists = await gistRepository.getPublicGists(1000, 0);

  const userIds = [...new Set(publicGists.map(gist => gist.ownerId))];
  const usersWithPublicGists = userIds.length > 0 ? await db
    .select()
    .from(users)
    .where(inArray(users.id, userIds)) : [];

  return [
    {
      url: url('/'),
      changeFrequency: 'monthly',
      priority: 1,
    },
    ...publicGists.map((gist) => ({
      url: url(`/g/${gist.id}`),
      lastModified: gist.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...usersWithPublicGists.map((user) => ({
      url: url(`/u/${user.handle}`),
      lastModified: user.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ];
}
