import { siteConfig, absoluteUrl } from './site-config';

/**
 * Type definitions and generators for schema.org structured data (JSON-LD)
 */

export interface BreadcrumbItem {
  name: string;
  url?: string;
}

export interface ProductSchemaInput {
  name: string;
  description?: string;
  image?: string;
  images?: string[];
  sku?: string;
  brand?: string;
  price?: number | string;
  currency?: string;
  inStock?: boolean;
  category?: string;
  ratingValue?: number;
  reviewCount?: number;
  url: string;
}

export interface ArticleSchemaInput {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  authorUrl?: string;
  url: string;
}

export interface BuildSchemaInput {
  name: string;
  description?: string;
  image?: string;
  totalPrice: number | string;
  currency?: string;
  authorName?: string;
  useCase?: string;
  cpuName?: string;
  gpuName?: string;
  components?: Array<{
    name: string;
    componentType?: string;
    price?: number | string;
  }>;
  url: string;
}

/**
 * Generates WebSite schema with SearchAction for site-wide Google search integration
 */
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generates Organization schema with brand metadata, logo, and social channels
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.legalName,
    alternateName: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl('/images/logo.png'),
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: siteConfig.contact.phone,
      contactType: 'customer service',
      email: siteConfig.contact.email,
      areaServed: 'IN',
      availableLanguage: ['en', 'hi'],
    },
    sameAs: [
      siteConfig.links.twitter,
      siteConfig.links.github,
      siteConfig.links.youtube,
    ],
  };
}

/**
 * Generates BreadcrumbList schema for hierarchical navigation
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: absoluteUrl(item.url) } : {}),
    })),
  };
}

/**
 * Generates Product schema with Offer, Brand, InStock, and optional AggregateRating
 */
export function generateProductSchema(input: ProductSchemaInput) {
  const images = input.images && input.images.length > 0
    ? input.images.map((img) => absoluteUrl(img))
    : input.image
    ? [absoluteUrl(input.image)]
    : [absoluteUrl(siteConfig.ogImage)];

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    image: images,
    description: input.description || `${input.name} available at ${siteConfig.name}`,
    sku: input.sku || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    mpn: input.sku,
    brand: {
      '@type': 'Brand',
      name: input.brand || siteConfig.name,
    },
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(input.url),
      priceCurrency: input.currency || siteConfig.currency,
      price: input.price !== undefined ? Number(input.price).toFixed(2) : '0.00',
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: input.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: siteConfig.name,
      },
    },
  };

  if (input.category) {
    schema.category = input.category;
  }

  if (input.ratingValue && input.reviewCount && input.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(input.ratingValue).toFixed(1),
      reviewCount: input.reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  return schema;
}

/**
 * Generates Article / BlogPosting schema
 */
export function generateArticleSchema(input: ArticleSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.title,
    description: input.description,
    image: absoluteUrl(input.image),
    datePublished: input.datePublished,
    dateModified: input.dateModified || input.datePublished,
    author: {
      '@type': 'Person',
      name: input.authorName || 'PC Platform Editorial Team',
      ...(input.authorUrl ? { url: absoluteUrl(input.authorUrl) } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/images/logo.png'),
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(input.url),
    },
  };
}

/**
 * Generates structured data for a Custom PC Build
 */
export function generateBuildSchema(input: BuildSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description:
      input.description ||
      `Custom ${input.useCase || 'Gaming'} PC Build featuring ${input.cpuName || 'High Performance CPU'} and ${input.gpuName || 'Discrete GPU'}`,
    image: input.image ? absoluteUrl(input.image) : absoluteUrl(siteConfig.ogImage),
    category: 'Custom PC Systems',
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(input.url),
      priceCurrency: input.currency || siteConfig.currency,
      price: Number(input.totalPrice || 0).toFixed(2),
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: siteConfig.name,
      },
    },
    isRelatedTo: (input.components || []).map((comp) => ({
      '@type': 'Product',
      name: comp.name,
      category: comp.componentType,
      ...(comp.price ? { offers: { '@type': 'Offer', price: Number(comp.price).toFixed(2), priceCurrency: input.currency || siteConfig.currency } } : {}),
    })),
  };
}

/**
 * Generates CollectionPage schema for catalog, categories, brands, or showcases
 */
export function generateCollectionSchema(title: string, description: string, url: string, items?: Array<{ name: string; url: string }>) {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: absoluteUrl(url),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: (items || []).map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: absoluteUrl(item.url),
      })),
    },
  };
  return schema;
}
