import type { Metadata } from 'next';
import { constructMetadata, JsonLd, generateBreadcrumbSchema, generateCollectionSchema } from '../../lib/seo';
import { ProductsPageClient } from './products-client';

export const metadata: Metadata = constructMetadata({
  title: 'Hardware Components Catalog — Processors, GPUs, Motherboards & DDR5',
  description:
    'Browse our comprehensive catalog of verified PC components. High-speed CPUs, NVIDIA/AMD graphics cards, motherboards, DDR5 RAM, and high-wattage power supplies with guaranteed compatibility.',
  canonicalPath: '/products',
  keywords: [
    'PC components India',
    'buy CPU online',
    'graphics cards price',
    'DDR5 RAM kits',
    'PCIe Gen5 SSD',
    'motherboards Z790 B650',
    'modular power supplies',
  ],
});

export const revalidate = 60;

export default function ProductsPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Hardware Catalog', url: '/products' },
  ]);

  const collectionSchema = generateCollectionSchema(
    'Hardware Component Catalog',
    'Browse our comprehensive catalog of verified PC components with real-time stock and compatibility validation.',
    '/products'
  );

  return (
    <>
      <JsonLd data={[breadcrumbSchema, collectionSchema]} />
      <ProductsPageClient />
    </>
  );
}
