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

export function SignInPageClient() {
  const { user, signIn, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!signInData.email || !signInData.password) {
      setError('Please fill in all fields');
      return;
    }

    const result = await signIn(signInData.email, signInData.password);
    if (result.success) {
      setSuccess('Signed in successfully!');
      router.push('/');
    } else {
      setError(result.error || 'Sign in failed');
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
          <CardTitle className="text-xl md:text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your Gist account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="Enter your email"
                value={signInData.email}
                onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <Input
                id="signin-password"
                type="password"
                placeholder="Enter your password"
                value={signInData.password}
                onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
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
            <p className="mb-2">Don't have an account?</p>
            <Link href="/signup" className="text-primary hover:underline">
              Create one here
            </Link>
          </div>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
