import { MetadataRoute } from 'next';
import { siteConfig } from '../lib/seo/site-config';
import { getAllBlogPosts } from '../lib/blogs';

// Fallback known catalog slugs to guarantee rich sitemap even during offline/build-time environments
const FALLBACK_CATEGORIES = [
  'processors',
  'graphics-cards',
  'motherboards',
  'memory',
  'storage',
  'power-supplies',
  'cases',
  'cooling',
];

const FALLBACK_BRANDS = [
  'asus',
  'intel',
  'amd',
  'corsair',
  'msi',
  'gigabyte',
  'nzxt',
  'deepcool',
  'samsung',
];

const FALLBACK_PRODUCTS = [
  'ryzen-7-7800x3d',
  'core-i7-14700k',
  'rtx-4080-super',
  'rtx-4070-ti-super',
  'asus-rog-strix-b650e-f',
  'corsair-vengeance-rgb-32gb-ddr5',
  'samsung-990-pro-2tb',
  'corsair-rm850x-atx-3-0',
  'lian-li-o11-vision',
  'deepcool-ls720-se-360mm',
];

const FALLBACK_BUILDS = [
  'cyberpunk-beast-rtx-4090',
  'all-white-minimalist-ryzen-7',
  'stealth-workstation-threadripper',
  'budget-1080p-esports-champion',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;
  const now = new Date();

  // 1. Static high-priority index routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/builder`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/deals`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ];

  // 2. Fetch live products from backend (with graceful fallback)
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const res = await fetch(`${apiUrl}/products?limit=100`, { next: { revalidate: 3600 } }).catch(() => null);
    if (res && res.ok) {
      const json = await res.json();
      const products = json.data || [];
      productRoutes = products
        .filter((p: any) => Boolean(p.slug))
        .map((p: any) => ({
          url: `${baseUrl}/products/${p.slug}`,
          lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
          changeFrequency: 'daily' as const,
          priority: 0.8,
        }));
    }
  } catch {
    // Network or API unavailable during build
  }

  if (productRoutes.length === 0) {
    productRoutes = FALLBACK_PRODUCTS.map((slug) => ({
      url: `${baseUrl}/products/${slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));
  }

  // 3. Fetch live categories
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const res = await fetch(`${apiUrl}/categories`, { next: { revalidate: 86400 } }).catch(() => null);
    if (res && res.ok) {
      const json = await res.json();
      const categories = json.data || [];
      categoryRoutes = categories
        .filter((c: any) => Boolean(c.slug))
        .map((c: any) => ({
          url: `${baseUrl}/categories/${c.slug}`,
          lastModified: now,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }));
    }
  } catch {
    // Graceful fallback
  }

  if (categoryRoutes.length === 0) {
    categoryRoutes = FALLBACK_CATEGORIES.map((slug) => ({
      url: `${baseUrl}/categories/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  }

  // 4. Fetch live brands
  let brandRoutes: MetadataRoute.Sitemap = [];
  try {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const res = await fetch(`${apiUrl}/brands`, { next: { revalidate: 86400 } }).catch(() => null);
    if (res && res.ok) {
      const json = await res.json();
      const brands = json.data || [];
      brandRoutes = brands
        .filter((b: any) => Boolean(b.slug))
        .map((b: any) => ({
          url: `${baseUrl}/brands/${b.slug}`,
          lastModified: now,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));
    }
  } catch {
    // Graceful fallback
  }

  if (brandRoutes.length === 0) {
    brandRoutes = FALLBACK_BRANDS.map((slug) => ({
      url: `${baseUrl}/brands/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  }

  // 5. Fetch live community builds
  let buildRoutes: MetadataRoute.Sitemap = [];
  try {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const res = await fetch(`${apiUrl}/community/builds?limit=50`, { next: { revalidate: 3600 } }).catch(() => null);
    if (res && res.ok) {
      const json = await res.json();
      const builds = json.data || [];
      buildRoutes = builds
        .filter((b: any) => Boolean(b.slug))
        .map((b: any) => ({
          url: `${baseUrl}/community/builds/${b.slug}`,
          lastModified: b.updatedAt ? new Date(b.updatedAt) : now,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));
    }
  } catch {
    // Graceful fallback
  }

  if (buildRoutes.length === 0) {
    buildRoutes = FALLBACK_BUILDS.map((slug) => ({
      url: `${baseUrl}/community/builds/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  }

  // 6. Blog article routes
  const blogPosts = getAllBlogPosts();
  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blogs/${post.slug}`,
    lastModified: new Date(post.updatedAt || post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...brandRoutes,
    ...productRoutes,
    ...buildRoutes,
    ...blogRoutes,
  ];
}
