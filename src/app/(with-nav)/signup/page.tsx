import { SignUpPageClient } from '@/components/auth/signup-page-client';
import { generateMetadata as genMetadata } from '@/lib/metadata-utils';

export const metadata = genMetadata({
  title: 'Sign Up',
  description: 'Create a new Gist account to start sharing and discovering code snippets',
  ogImagePath: '/api/og',
});

export default function SignUpPage() {
  return <SignUpPageClient />;
}
