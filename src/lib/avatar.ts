import { getGravatarUrl, getGravatarUrlWithOptions } from './gravatar';

/**
 * Get user avatar URL with Gravatar fallback
 * @param user - User object with email and optional photoUrl
 * @param size - Avatar size in pixels (default: 200)
 * @returns Avatar URL
 */
export function getUserAvatarUrl(
  user: { email: string; photoUrl?: string | null },
  size: number = 200
): string {
  if (user.photoUrl) {
    return user.photoUrl;
  }

  return getGravatarUrl(user.email, size);
}

/**
 * Get user avatar URL with custom Gravatar options
 */
export function getUserAvatarUrlWithOptions(
  user: { email: string; photoUrl?: string | null },
  options: {
    size?: number;
    defaultImage?: string;
    rating?: 'g' | 'pg' | 'r' | 'x';
    forceDefault?: boolean;
  } = {}
): string {
  if (user.photoUrl) {
    return user.photoUrl;
  }

  return getGravatarUrlWithOptions(user.email, options);
}
