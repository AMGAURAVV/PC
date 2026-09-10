import type { Metadata } from 'next';
import {
  constructMetadata,
  JsonLd,
  generateBreadcrumbSchema,
  siteConfig,
  absoluteUrl,
} from '../../lib/seo';
import { BuilderClient } from './builder-client';

export const metadata: Metadata = constructMetadata({
  title: 'Custom PC Builder — Intelligent Hardware Compatibility Engine',
  description:
    'Build your custom gaming or workstation PC with real-time socket, PCIe clearance, and wattage validation. Configure parts, verify compatibility, and check price history in India.',
  canonicalPath: '/builder',
  keywords: [
    'PC builder tool',
    'custom PC configurator India',
    'compatibility checker PC parts',
    'PC wattage calculator',
    'gaming PC parts picker',
    'RTX 4080 rig builder',
  ],
});

export default function PCBuilderPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Custom PC Builder', url: '/builder' },
  ]);

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Nexus Custom PC Builder',
    url: absoluteUrl('/builder'),
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    description:
      'Authoritative rule-based custom PC configurator with physical dimensions and power headroom evaluation.',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    },
    creator: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  return (
    <>
      <JsonLd data={[breadcrumbSchema, webAppSchema]} />
      <BuilderClient />
    </>
  );
}
