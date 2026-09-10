import type { Metadata } from 'next';
import {
  constructMetadata,
  JsonLd,
  generateCollectionSchema,
  generateBreadcrumbSchema,
} from '../../../lib/seo';
import { CategoryDetailClient } from './category-client';

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

async function fetchCategory(slug: string) {
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  try {
    const res = await fetch(`${apiUrl}/categories/slug/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = await fetchCategory(params.slug);
  const categoryName = category?.name || params.slug.replace(/-/g, ' ').toUpperCase();

  const title = `Buy ${categoryName} Online — Best Prices & Rig Compatibility`;
  const description =
    category?.description ||
    `Shop high-performance ${categoryName} components in India. Verified for socket fitment, PCIe bus speed, power budget, and thermal clearance.`;

  return constructMetadata({
    title,
    description,
    canonicalPath: `/categories/${params.slug}`,
    keywords: [
      categoryName,
      `buy ${categoryName} India`,
      `${categoryName} price`,
      'compatible components',
      'PC builder parts',
    ],
  });
}

export const revalidate = 60;

export default async function CategoryPage({ params }: CategoryPageProps) {
  const category = await fetchCategory(params.slug);
  const categoryName = category?.name || params.slug.replace(/-/g, ' ').toUpperCase();

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Categories', url: '/products' },
    { name: categoryName, url: `/categories/${params.slug}` },
  ];

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const collectionSchema = generateCollectionSchema(
    `${categoryName} Hardware Catalog`,
    category?.description || `Explore verified ${categoryName} hardware components.`,
    `/categories/${params.slug}`
  );

  return (
    <>
      <JsonLd data={[breadcrumbSchema, collectionSchema]} />
      <CategoryDetailClient slug={params.slug} />
    </>
  );
}
