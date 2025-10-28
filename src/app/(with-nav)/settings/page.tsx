import { SettingsPageClient } from '@/components/settings/settings-page-client';
import { generateMetadata as genMetadata } from '@/lib/metadata-utils';

export const metadata = genMetadata({
  title: 'Settings',
  description: 'Manage your account settings and preferences',
  ogImagePath: '/api/og',
});

export default function SettingsPage() {
  return <SettingsPageClient />;
}