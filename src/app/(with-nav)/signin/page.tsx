import { SignInPageClient } from '@/components/auth/signin-page-client';
import { generateMetadata as genMetadata } from '@/lib/metadata-utils';

export const metadata = genMetadata({
  title: 'Sign In',
  description: 'Sign in to your Gist account to create, share, and discover code snippets',
  ogImagePath: '/api/og',
});

export default function SignInPage() {
  return <SignInPageClient />;
}