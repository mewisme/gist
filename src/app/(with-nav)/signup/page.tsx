import { Metadata } from 'next';

import { SignUpPageClient } from '@/components/auth/signup-page-client';

export const metadata: Metadata = {
  title: 'Sign Up - Gist',
  description: 'Create a new Gist account to start sharing and discovering code snippets',
};

export default function SignUpPage() {
  return <SignUpPageClient />;
}