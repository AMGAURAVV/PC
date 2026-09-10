import type { Metadata } from 'next';
import {
  constructMetadata,
  JsonLd,
  generateCollectionSchema,
  generateBreadcrumbSchema,
} from '../../lib/seo';
import { CommunityClient } from './community-client';

export const metadata: Metadata = constructMetadata({
  title: 'Community PC Builds Showcase — Gaming, Workstation & Budget Rigs',
  description:
    'Explore enthusiast custom PC builds published by the community. Filter by budget, GPU, CPU, and workload use-case with verified parts compatibility and pricing.',
  canonicalPath: '/community',
  keywords: [
    'community PC builds',
    'gaming PC showcase',
    'custom PC rigs India',
    'PC builder setups',
    'budget gaming PC builds',
    'RTX 4090 community builds',
  ],
});

export const revalidate = 60;

export default function CommunityPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Community Showcase', url: '/community' },
  ]);

  const collectionSchema = generateCollectionSchema(
    'Community PC Builds Showcase',
    'Enthusiast custom PC builds published by verified builders with parts compatibility and pricing telemetry.',
    '/community'
  );

  return (
    <>
      <JsonLd data={[breadcrumbSchema, collectionSchema]} />
      <CommunityClient />
    </>
  );
}
