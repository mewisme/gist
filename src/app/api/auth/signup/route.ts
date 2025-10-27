import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createSession, createUser, generateJWT } from '@/lib/auth-utils';

const signupSchema = z.object({
  email: z
    .email('Invalid email address')
    .refine((email) => email.endsWith('@gmail.com'), {
      message: 'Only Gmail addresses are allowed',
    }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required').max(50, 'Display name too long'),
  handle: z.string().min(3, 'Handle must be at least 3 characters').max(30, 'Handle too long').optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { email, password, displayName, handle } = validationResult.data;

    const user = await createUser({
      email,
      password,
      displayName,
      handle,
    });

    const token = await createSession(
      user.id,
      request.headers.get('user-agent') || undefined,
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    );

    const response = NextResponse.json({
      user,
      message: 'Account created successfully',
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);

    if (error instanceof Error) {
      if (error.message.includes('already registered') || error.message.includes('already taken')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
