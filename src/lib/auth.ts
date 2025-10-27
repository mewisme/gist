import { AuthUser, verifySession } from './auth-utils';

/**
 * Get user from request headers (for Server Actions)
 */
export async function getUserFromRequest(request: Request): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifySession(token);
}

/**
 * Get user from cookies (for API routes and Server Actions)
 */
export async function getUserFromCookies(cookies: any): Promise<AuthUser | null> {
  const token = cookies.get('auth-token')?.value;
  if (!token) {
    return null;
  }

  return verifySession(token);
}

/**
 * Get current user for Server Actions
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  return getUserFromCookies(cookieStore);
}

export type { AuthUser } from './auth-utils';
