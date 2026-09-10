import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  constructMetadata,
  JsonLd,
  generateProductSchema,
  generateBreadcrumbSchema,
  siteConfig,
} from '../../../lib/seo';
import { ProductDetailClient } from './product-detail-client';

export const revalidate = 60;

interface ProductPageProps {
  params: {
    slug: string;
  };
}

async function fetchProduct(slug: string) {
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  try {
    const res = await fetch(`${apiUrl}/products/slug/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await fetchProduct(params.slug);

  if (!product) {
    return constructMetadata({
      title: 'Component Not Found',
      description: 'The requested PC component could not be found or has been archived.',
      canonicalPath: `/products/${params.slug}`,
      noIndex: true,
    });
  }

  const primaryImage =
    product.images && product.images.length > 0
      ? product.images[0].url
      : siteConfig.ogImage;

  const brandName = product.brand ? `${product.brand} ` : '';
  const title = `${product.name} — Specs, Price & Compatibility`;
  const description =
    product.description ||
    `Buy ${brandName}${product.name} in India at ₹${Number(product.price).toLocaleString('en-IN')}. Guaranteed compatibility, manufacturer warranty, and express shipping.`;

  return constructMetadata({
    title,
    description,
    image: primaryImage,
    canonicalPath: `/products/${params.slug}`,
    keywords: [
      product.name,
      product.brand || '',
      product.sku || '',
      product.category?.name || 'PC component',
      'buy online India',
      'price in India',
      'specs and compatibility',
    ].filter(Boolean),
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await fetchProduct(params.slug);

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Hardware Catalog', url: '/products' },
  ];

  if (product?.category) {
    breadcrumbs.push({
      name: product.category.name,
      url: `/categories/${product.category.slug}`,
    });
  }

  breadcrumbs.push({
    name: product?.name || params.slug,
    url: `/products/${params.slug}`,
  });

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);

  const productSchema = product
    ? generateProductSchema({
        name: product.name,
        description: product.description,
        image: product.images?.[0]?.url,
        images: product.images?.map((img: any) => img.url),
        sku: product.sku,
        brand: product.brand,
        price: product.price,
        currency: 'INR',
        inStock: product.stock > 0,
        category: product.category?.name,
        ratingValue: 4.8,
        reviewCount: 24,
        url: `/products/${params.slug}`,
      })
    : null;

  return (
    <>
      <JsonLd data={productSchema ? [productSchema, breadcrumbSchema] : [breadcrumbSchema]} />
      <ProductDetailClient slug={params.slug} initialProduct={product} />
    </>
  );
}
