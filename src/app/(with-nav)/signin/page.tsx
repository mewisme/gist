import { Metadata } from 'next';

import { SignInPageClient } from '@/components/auth/signin-page-client';

export const metadata: Metadata = {
  title: 'Sign In - Gist',
  description: 'Sign in to your Gist account to create, share, and discover code snippets',
};

export default function SignInPage() {
  return <SignInPageClient />;
}