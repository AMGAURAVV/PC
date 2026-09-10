import type { Metadata } from 'next';
import {
  constructMetadata,
  JsonLd,
  generateCollectionSchema,
  generateBreadcrumbSchema,
} from '../../lib/seo';
import { DealsClient } from './deals-client';

export const metadata: Metadata = constructMetadata({
  title: 'Hardware Deals, Discounts & Clearance Drops',
  description:
    'Save on CPUs, GPUs, DDR5 memory kits, and NVMe SSDs. Exclusive partner promotions, limited-time flash sales, and manufacturer rebates in India.',
  canonicalPath: '/deals',
  keywords: [
    'PC hardware deals',
    'GPU discount India',
    'gaming PC sales',
    'cheap graphics cards',
    'DDR5 RAM discount',
    'NVMe SSD clearance',
  ],
});

export default function DealsPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Hardware Deals', url: '/deals' },
  ]);

  const collectionSchema = generateCollectionSchema(
    'Hardware Deals & Promotions',
    'Curated discounted hardware components and limited time promotion drops.',
    '/deals'
  );

  return (
    <>
      <JsonLd data={[breadcrumbSchema, collectionSchema]} />
      <DealsClient />
    </>
  );
}
