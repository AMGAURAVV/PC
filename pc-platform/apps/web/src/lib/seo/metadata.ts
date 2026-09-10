import type { Metadata } from 'next';
import { siteConfig, absoluteUrl } from './site-config';

export interface MetadataOptions {
  title?: string;
  description?: string;
  image?: string;
  canonicalPath?: string;
  keywords?: string[];
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  noIndex?: boolean;
}

/**
 * Constructs a complete Next.js Metadata object including OpenGraph,
 * Twitter/X Cards, canonical URLs, and robots directives.
 */
export function constructMetadata(options: MetadataOptions = {}): Metadata {
  const {
    title,
    description = siteConfig.description,
    image = siteConfig.ogImage,
    canonicalPath = '',
    keywords = [],
    type = 'website',
    publishedTime,
    modifiedTime,
    author,
    noIndex = false,
  } = options;

  const resolvedCanonicalUrl = absoluteUrl(canonicalPath);
  const resolvedImageUrl = image.startsWith('http') ? image : absoluteUrl(image);

  const defaultKeywords = [
    'custom PC build',
    'PC builder India',
    'gaming PC components',
    'hardware compatibility engine',
    'RTX 4090 builds',
    'AMD Ryzen processors',
    'PC parts price tracker',
    'verified community builds',
  ];

  const mergedKeywords = Array.from(new Set([...keywords, ...defaultKeywords]));

  const ogImages = [
    {
      url: resolvedImageUrl,
      width: 1200,
      height: 630,
      alt: title ? `${title} — PC Platform` : siteConfig.name,
    },
  ];

  return {
    title: title
      ? {
          default: `${title} | ${siteConfig.name}`,
          template: `%s | ${siteConfig.name}`,
        }
      : {
          default: `${siteConfig.name} — ${siteConfig.tagline}`,
          template: `%s | ${siteConfig.name}`,
        },
    description,
    keywords: mergedKeywords,
    authors: author ? [{ name: author }] : [{ name: siteConfig.name }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: resolvedCanonicalUrl,
    },
    openGraph: {
      title: title ? `${title} | ${siteConfig.name}` : `${siteConfig.name} — ${siteConfig.tagline}`,
      description,
      url: resolvedCanonicalUrl,
      siteName: siteConfig.name,
      images: ogImages,
      locale: siteConfig.locale,
      type,
      ...(type === 'article' && {
        publishedTime,
        modifiedTime,
        authors: author ? [author] : [siteConfig.name],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: title ? `${title} | ${siteConfig.name}` : `${siteConfig.name} — ${siteConfig.tagline}`,
      description,
      images: [resolvedImageUrl],
      creator: siteConfig.twitterHandle,
      site: siteConfig.twitterHandle,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
  };
}
