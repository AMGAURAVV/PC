import type { Metadata } from 'next';
import { constructMetadata } from '../lib/seo';
import { HomePageClient } from './home-client';

export const metadata: Metadata = constructMetadata({
  title: 'Custom PC Builder & Precision Hardware Telemetry',
  description:
    'India\'s premier custom PC building platform. Configure hardware with guaranteed socket, PCIe, and thermal compatibility, track price history, and browse verified community builds.',
  canonicalPath: '/',
  keywords: [
    'custom PC builder',
    'buy gaming PC India',
    'PC parts compatibility check',
    'RTX 4090 PC build',
    'best PC build 2026',
    'custom rig configurator',
  ],
});

export default function HomePage() {
  return <HomePageClient />;
}
