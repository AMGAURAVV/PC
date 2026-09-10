import type { Metadata } from 'next';
import { constructMetadata } from '../../lib/seo';
import { SearchClient } from './search-client';

export const metadata: Metadata = constructMetadata({
  title: 'Search Components & Hardware Catalog',
  description: 'Search through our inventory of CPUs, GPUs, motherboards, memory kits, and accessories.',
  canonicalPath: '/search',
  noIndex: true, // Standard SEO practice: Prevent parameter query duplicate content indexing
});

export default function SearchPage() {
  return <SearchClient />;
}
