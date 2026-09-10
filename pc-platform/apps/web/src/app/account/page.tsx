import type { Metadata } from 'next';
import { constructMetadata } from '../../lib/seo';
import { AccountClient } from './account-client';

export const metadata: Metadata = constructMetadata({
  title: 'Customer Dashboard & Saved Rigs',
  description: 'Manage your hardware wishlist, order telemetry, and saved custom configurations.',
  canonicalPath: '/account',
  noIndex: true,
});

export default function AccountPage() {
  return <AccountClient />;
}
