import bcrypt from 'bcryptjs';
import { and, eq, lt } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

import { generateId } from '@/lib/id-utils';

import { db, userPasswords, users,userSessions } from './db';
import { getGravatarUrl } from './gravatar';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = '7d';
const SESSION_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000;

export interface AuthUser {
  id: string;
  email: string;
  handle: string;
  displayName: string;
  photoUrl?: string;
  emailVerified: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  displayName: string;
  handle?: string;
}

export interface SigninData {
  email: string;
  password: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 */
export function generateJWT(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      handle: user.handle,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify and decode a JWT token
 */
export function verifyJWT(token: string): { id: string; email: string; handle: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      email: decoded.email,
      handle: decoded.handle,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Generate a unique handle for a user
 */
export function generateUniqueHandle(displayName: string): string {
  const baseHandle = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);

  const randomSuffix = generateId().substring(0, 6);
  return `${baseHandle}_${randomSuffix}`;
}

/**
 * Check if a handle is available
 */
export async function isHandleAvailable(handle: string): Promise<boolean> {
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.handle, handle))
    .limit(1);

  return existingUser.length === 0;
}

/**
 * Check if an email is available
 */
export async function isEmailAvailable(email: string): Promise<boolean> {
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return existingUser.length === 0;
}

/**
 * Create a new user account
 */
export async function createUser(data: SignupData): Promise<AuthUser> {
  const { email, password, displayName, handle } = data;

  if (!(await isEmailAvailable(email))) {
    throw new Error('Email is already registered');
  }

  const userHandle = handle || generateUniqueHandle(displayName);
  if (!(await isHandleAvailable(userHandle))) {
    throw new Error('Handle is already taken');
  }

  const passwordHash = await hashPassword(password);

  const userId = generateId();
  const newUser = {
    id: userId,
    email,
    handle: userHandle,
    displayName,
    photoUrl: getGravatarUrl(email),
    emailVerified: true,
  };

  db.transaction((tx) => {
    tx.insert(users).values(newUser).run(); 
    tx.insert(userPasswords).values({
      userId: userId,
      passwordHash,
      salt: '',
    }).run();
  });

  return newUser;
}

/**
 * Authenticate a user with email and password
 */
export async function authenticateUser(data: SigninData): Promise<AuthUser | null> {
  const { email, password } = data;

  const userWithPassword = await db
    .select({
      id: users.id,
      email: users.email,
      handle: users.handle,
      displayName: users.displayName,
      photoUrl: users.photoUrl,
      emailVerified: users.emailVerified,
      passwordHash: userPasswords.passwordHash,
    })
    .from(users)
    .innerJoin(userPasswords, eq(users.id, userPasswords.userId))
    .where(eq(users.email, email))
    .limit(1);

  if (userWithPassword.length === 0) {
    return null;
  }

  const user = userWithPassword[0];

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    handle: user.handle,
    displayName: user.displayName,
    photoUrl: user.photoUrl || undefined,
    emailVerified: user.emailVerified,
  };
}

/**
 * Create a new session for a user
 */
export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<string> {
  const sessionId = generateId();
  const token = generateJWT({ id: userId, email: '', handle: '', displayName: '', emailVerified: false });
  const expiresAt = new Date(Date.now() + SESSION_EXPIRES_IN);

  db.insert(userSessions).values({
    id: sessionId,
    userId,
    token,
    expiresAt,
    userAgent,
    ipAddress,
  }).run();

  return token;
}

/**
 * Verify a session token and return user data
 */
export async function verifySession(token: string): Promise<AuthUser | null> {
  const jwtPayload = verifyJWT(token);
  if (!jwtPayload) {
    return null;
  }

  const session = await db
    .select({
      id: userSessions.id,
      userId: userSessions.userId,
      expiresAt: userSessions.expiresAt,
    })
    .from(userSessions)
    .where(
      and(
        eq(userSessions.token, token),
        eq(userSessions.userId, jwtPayload.id)
      )
    )
    .limit(1);

  if (session.length === 0) {
    return null;
  }

  const sessionData = session[0];

  if (new Date() > sessionData.expiresAt) {
    db.delete(userSessions).where(eq(userSessions.id, sessionData.id)).run();
    return null;
  }

  const user = await db
    .select({
      id: users.id,
      email: users.email,
      handle: users.handle,
      displayName: users.displayName,
      photoUrl: users.photoUrl,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.id, jwtPayload.id))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  const userData = user[0];
  return {
    id: userData.id,
    email: userData.email,
    handle: userData.handle,
    displayName: userData.displayName,
    photoUrl: userData.photoUrl || undefined,
    emailVerified: userData.emailVerified,
  };
}

/**
 * Delete a session (sign out)
 */
export async function deleteSession(token: string): Promise<void> {
  db.delete(userSessions).where(eq(userSessions.token, token)).run();
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const now = new Date();
  db.delete(userSessions).where(lt(userSessions.expiresAt, now)).run();
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<AuthUser | null> {
  const user = await db
    .select({
      id: users.id,
      email: users.email,
      handle: users.handle,
      displayName: users.displayName,
      photoUrl: users.photoUrl,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  const userData = user[0];
  return {
    id: userData.id,
    email: userData.email,
    handle: userData.handle,
    displayName: userData.displayName,
    photoUrl: userData.photoUrl || undefined,
    emailVerified: userData.emailVerified,
  };
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<AuthUser | null> {
  const user = await db
    .select({
      id: users.id,
      email: users.email,
      handle: users.handle,
      displayName: users.displayName,
      photoUrl: users.photoUrl,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  const userData = user[0];
  return {
    id: userData.id,
    email: userData.email,
    handle: userData.handle,
    displayName: userData.displayName,
    photoUrl: userData.photoUrl || undefined,
    emailVerified: userData.emailVerified,
  };
}
