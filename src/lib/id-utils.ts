import { createHash } from 'crypto';

let counter = 0;

/**
 * Generate a SHA-256 based ID similar to Git commit hashes
 * Uses timestamp + counter + random data to create a unique hash
 */
export function generateFullId(): string {
  const now = Date.now();
  const timestamp = now.toString();

  counter = (counter + 1) % 1000000;

  const randomData = Math.random().toString(36) + Math.random().toString(36);
  const input = `${timestamp}-${counter}-${randomData}-${process.hrtime.bigint()}`;

  const hash = createHash('sha256').update(input).digest('hex');

  return hash;
}

/**
 * Generate a short ID (12 characters) - this is now the default ID generation
 * Uses the same algorithm as generateFullId() but returns only the first 12 characters
 */
export function generateId(): string {
  return generateFullId().substring(0, 12);
}

/**
 * Generate both full and short ID from the same hash (like Git)
 * Returns an object with both full and short versions
 */
export function generateGitLikeId(): { full: string; short: string } {
  const fullId = generateFullId();
  return {
    full: fullId,
    short: fullId.substring(0, 12)
  };
}

/**
 * Generate a short ID (first 12 characters of a new hash)
 * This is now an alias for generateId() for backward compatibility
 */
export function generateShortId(): string {
  return generateId();
}

/**
 * Convert a full ID to its short version
 */
export function toShortId(fullId: string): string {
  return fullId.substring(0, 12);
}

/**
 * Check if an ID is a short ID (12 characters or less)
 */
export function isShortId(id: string): boolean {
  return id.length <= 12;
}

/**
 * Check if an ID is a full ID (64 characters)
 */
export function isFullId(id: string): boolean {
  return id.length === 64;
}
