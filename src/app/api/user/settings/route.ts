import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getUserFromCookies } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/auth-utils';
import { db, userPasswords, users } from '@/lib/db';

const updateProfileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(50, 'Display name too long').optional(),
  handle: z.string().min(3, 'Handle must be at least 3 characters').max(30, 'Handle too long').optional(),
  email: z.string().email('Invalid email address').optional(),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    if (type === 'profile') {
      const validationResult = updateProfileSchema.safeParse(data);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const updateData = validationResult.data;

      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, updateData.email))
          .limit(1);

        if (existingUser.length > 0) {
          return NextResponse.json(
            { error: 'Email is already taken' },
            { status: 400 }
          );
        }
      }

      if (updateData.handle && updateData.handle !== user.handle) {
        const existingUser = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.handle, updateData.handle))
          .limit(1);

        if (existingUser.length > 0) {
          return NextResponse.json(
            { error: 'Handle is already taken' },
            { status: 400 }
          );
        }
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning();

      return NextResponse.json({
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          handle: updatedUser.handle,
          displayName: updatedUser.displayName,
          photoUrl: updatedUser.photoUrl,
          emailVerified: updatedUser.emailVerified,
        },
      });
    }

    if (type === 'password') {
      const validationResult = updatePasswordSchema.safeParse(data);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const { currentPassword, newPassword } = validationResult.data;

      const passwordResult = await db
        .select({ passwordHash: userPasswords.passwordHash })
        .from(userPasswords)
        .where(eq(userPasswords.userId, user.id))
        .limit(1);

      if (passwordResult.length === 0) {
        return NextResponse.json(
          { error: 'Password not found' },
          { status: 404 }
        );
      }

      const isValidPassword = await verifyPassword(currentPassword, passwordResult[0].passwordHash);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      const newPasswordHash = await hashPassword(newPassword);

      await db
        .update(userPasswords)
        .set({
          passwordHash: newPasswordHash,
        })
        .where(eq(userPasswords.userId, user.id));

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully',
      });
    }

    return NextResponse.json(
      { error: 'Invalid update type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
