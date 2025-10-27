'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SignUpPageClient() {
  const { user, signUp, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    handle: '',
  });

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!signUpData.email || !signUpData.password || !signUpData.displayName) {
      setError('Please fill in all required fields');
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (signUpData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    const result = await signUp(
      signUpData.email,
      signUpData.password,
      signUpData.displayName,
      signUpData.handle || undefined
    );

    if (result.success) {
      setSuccess('Account created successfully!');
      router.push('/');
    } else {
      setError(result.error || 'Sign up failed');
    }
  };

  if (user) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Already signed in</h1>
        <Button onClick={() => router.push('/')}>
          Go to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl md:text-2xl">Create Account</CardTitle>
          <CardDescription>
            Join Gist to create, share, and discover code snippets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email *</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="Enter your email"
                value={signUpData.email}
                onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-display-name">Display Name *</Label>
              <Input
                id="signup-display-name"
                type="text"
                placeholder="Enter your display name"
                value={signUpData.displayName}
                onChange={(e) => setSignUpData({ ...signUpData, displayName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-handle">Handle (optional)</Label>
              <Input
                id="signup-handle"
                type="text"
                placeholder="Enter your handle"
                value={signUpData.handle}
                onChange={(e) => setSignUpData({ ...signUpData, handle: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                If not provided, a handle will be generated automatically
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password *</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="Enter your password"
                value={signUpData.password}
                onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-confirm-password">Confirm Password *</Label>
              <Input
                id="signup-confirm-password"
                type="password"
                placeholder="Confirm your password"
                value={signUpData.confirmPassword}
                onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mt-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p className="mb-2">Already have an account?</p>
            <Link href="/signin" className="text-primary hover:underline">
              Sign in here
            </Link>
          </div>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
