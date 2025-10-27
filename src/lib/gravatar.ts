import CryptoJS from 'crypto-js';

/**
 * Generate Gravatar URL from email address
 * @param email - User's email address
 * @param size - Avatar size in pixels (default: 200)
 * @param defaultImage - Default image type (default: 'identicon')
 * @returns Gravatar URL
 */
export function getGravatarUrl(
  email: string,
  size: number = 200,
  defaultImage: string = 'identicon'
): string {
  const normalizedEmail = email.trim().toLowerCase();

  const hash = CryptoJS.MD5(normalizedEmail).toString();

  const baseUrl = 'https://www.gravatar.com/avatar';
  const params = new URLSearchParams({
    s: size.toString(),
    d: defaultImage,
  });

  return `${baseUrl}/${hash}?${params.toString()}`;
}

/**
 * Get Gravatar URL with different default image options
 */
export const GravatarDefaults = {
  IDENTICON: 'identicon',
  MONSTERID: 'monsterid',
  WAVATAR: 'wavatar',
  RETRO: 'retro',
  ROBOHASH: 'robohash',
  BLANK: 'blank',
  MP: 'mp',
} as const;

/**
 * Get Gravatar URL with custom options
 */
export function getGravatarUrlWithOptions(
  email: string,
  options: {
    size?: number;
    defaultImage?: string;
    rating?: 'g' | 'pg' | 'r' | 'x';
    forceDefault?: boolean;
  } = {}
): string {
  const {
    size = 200,
    defaultImage = GravatarDefaults.IDENTICON,
    rating = 'g',
    forceDefault = false,
  } = options;

  const normalizedEmail = email.trim().toLowerCase();
  const hash = CryptoJS.MD5(normalizedEmail).toString();

  const baseUrl = 'https://www.gravatar.com/avatar';
  const params = new URLSearchParams({
    s: size.toString(),
    d: defaultImage,
    r: rating,
  });

  if (forceDefault) {
    params.set('f', 'y');
  }

  return `${baseUrl}/${hash}?${params.toString()}`;
}

/**
 * Check if a Gravatar exists for the given email
 * This makes a HEAD request to check if the avatar exists
 * Note: This is a client-side function and should be used carefully
 */
export async function checkGravatarExists(email: string): Promise<boolean> {
  try {
    const gravatarUrl = getGravatarUrlWithOptions(email, {
      defaultImage: '404',
      size: 1
    });

    const response = await fetch(gravatarUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error checking Gravatar:', error);
    return false;
  }
}
