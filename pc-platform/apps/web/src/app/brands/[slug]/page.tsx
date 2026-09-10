import type { Metadata } from 'next';
import {
  constructMetadata,
  JsonLd,
  generateCollectionSchema,
  generateBreadcrumbSchema,
} from '../../../lib/seo';
import { BrandDetailClient } from './brand-client';

interface BrandPageProps {
  params: {
    slug: string;
  };
}

async function fetchBrand(slug: string) {
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  try {
    const res = await fetch(`${apiUrl}/brands/slug/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const brand = await fetchBrand(params.slug);
  const brandName = brand?.name || params.slug.replace(/-/g, ' ').toUpperCase();

  const title = `${brandName} PC Components & Hardware | Authorized Partner`;
  const description =
    brand?.description ||
    `Explore verified ${brandName} computer hardware and components in India. 100% genuine manufacturer warranty, official firmware, and express delivery.`;

  return constructMetadata({
    title,
    description,
    canonicalPath: `/brands/${params.slug}`,
    keywords: [
      brandName,
      `${brandName} hardware`,
      `${brandName} components India`,
      `buy ${brandName} online`,
      'authorized brand partner',
    ],
  });
}

export const revalidate = 60;

export default async function BrandPage({ params }: BrandPageProps) {
  const brand = await fetchBrand(params.slug);
  const brandName = brand?.name || params.slug.replace(/-/g, ' ').toUpperCase();

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Brands', url: '/products' },
    { name: brandName, url: `/brands/${params.slug}` },
  ];

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const collectionSchema = generateCollectionSchema(
    `${brandName} Hardware Lineup`,
    brand?.description || `Authorized hardware portfolio manufactured by ${brandName}.`,
    `/brands/${params.slug}`
  );

  return (
    <>
      <JsonLd data={[breadcrumbSchema, collectionSchema]} />
      <BrandDetailClient slug={params.slug} />
    </>
  );
}
