import { Metadata } from 'next';

import { SettingsPageClient } from '@/components/settings/settings-page-client';

export const metadata: Metadata = {
  title: 'Settings - Gist',
  description: 'Manage your account settings and preferences',
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}